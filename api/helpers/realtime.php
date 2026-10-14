<?php
/**
 * Publishes an event to the Workerman realtime server (realtime/server.php)
 * after a mutation, so it can broadcast the change to connected browsers.
 * This is the ONLY change the REST controllers needed for live updates —
 * one line per mutating action, no rewrite.
 *
 * Implementation note: the realtime server is a single WebSocket worker
 * (see realtime/server.php for why), so "publishing" from plain PHP means
 * speaking the WebSocket protocol directly for one short-lived connection:
 * open a TCP socket, send the opening HTTP handshake, write one masked
 * text frame carrying our JSON payload (tagged with a shared secret so
 * the server knows this is a publish, not a real browser client), then
 * close. That's the entire client — no Composer dependency needed here,
 * deliberately, so this helper has zero extra moving parts of its own.
 *
 * Fire-and-forget: if the realtime server isn't running, every step below
 * fails silently (@-suppressed) and the REST API keeps working exactly as
 * before. Live updates are an enhancement, never a dependency of the core app.
 */
function notify_realtime(string $event, array $data = []): void {
    require_once __DIR__ . '/env.php';
    load_env(__DIR__ . '/../../.env');

    $host   = env('REALTIME_WS_HOST', '127.0.0.1');
    $port   = (int) env('REALTIME_WS_PORT', '8081');
    $secret = env('REALTIME_PUBLISH_SECRET', 'lf-local-dev-secret');
    // A bound host of 0.0.0.0 means "listens everywhere"; to connect out
    // from the same machine we dial 127.0.0.1 specifically.
    $connectHost = ($host === '0.0.0.0') ? '127.0.0.1' : $host;

    $socket = @stream_socket_client(
        "tcp://{$connectHost}:{$port}", $errno, $errstr, 0.3
    );
    if ($socket === false) {
        return; // realtime server not running — nothing to do
    }
    stream_set_timeout($socket, 1);

    $key = base64_encode(random_bytes(16));
    $handshake = "GET / HTTP/1.1\r\n"
        . "Host: {$connectHost}:{$port}\r\n"
        . "Upgrade: websocket\r\n"
        . "Connection: Upgrade\r\n"
        . "Sec-WebSocket-Key: {$key}\r\n"
        . "Sec-WebSocket-Version: 13\r\n\r\n";

    if (@fwrite($socket, $handshake) === false) {
        @fclose($socket);
        return;
    }

    $response = @fread($socket, 2048);
    if ($response === false || stripos($response, '101') === false) {
        @fclose($socket);
        return;
    }

    $payload = json_encode(['secret' => $secret, 'event' => $event, 'data' => $data]);
    @fwrite($socket, ws_encode_client_frame($payload));
    @fclose($socket);
}

/** Encodes one masked WebSocket text frame, as RFC 6455 requires from a client. */
function ws_encode_client_frame(string $payload): string {
    $length = strlen($payload);
    $frame = chr(0x81); // FIN + text opcode

    if ($length <= 125) {
        $frame .= chr($length | 0x80);
    } elseif ($length <= 65535) {
        $frame .= chr(126 | 0x80) . pack('n', $length);
    } else {
        $frame .= chr(127 | 0x80) . pack('J', $length);
    }

    $mask = random_bytes(4);
    $frame .= $mask;
    for ($i = 0; $i < $length; $i++) {
        $frame .= $payload[$i] ^ $mask[$i % 4];
    }

    return $frame;
}
