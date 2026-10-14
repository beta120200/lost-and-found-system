<?php
/**
 * Realtime server for live updates.
 *
 * Run this as its own long-lived process, alongside Apache/MySQL:
 *   php realtime/server.php start        (foreground, Ctrl+C to stop)
 *   php realtime/server.php start -d      (background/daemon — not on Windows)
 *
 * Design note: this is deliberately ONE Worker on ONE port, not two.
 * Workerman forks a separate OS process per Worker instance, so two
 * Workers do NOT share a plain PHP array in memory — an earlier version
 * of this file tried a WebSocket worker plus a separate HTTP worker and
 * that broadcast simply never arrived, because each ran in its own
 * process with its own copy of the client list. Collapsing to a single
 * WebSocket worker avoids the problem entirely: there's only one process,
 * so $clients below really is shared between every connection it handles.
 *
 * The PHP REST API "publishes" an event by connecting to this same
 * WebSocket port as just another client (see api/helpers/realtime.php,
 * which speaks the WebSocket protocol directly in a few lines — no
 * Composer dependency needed on that side), sending one JSON message
 * tagged with a shared secret, then disconnecting. Real browser clients
 * never see that secret or that message; it's intercepted and broadcast
 * to everyone else instead of being echoed back.
 */

require __DIR__ . '/../vendor/autoload.php';
require __DIR__ . '/../api/helpers/env.php';

load_env(__DIR__ . '/../.env');

use Workerman\Worker;
use Workerman\Connection\TcpConnection;

$host   = env('REALTIME_WS_HOST', '0.0.0.0');
$port   = env('REALTIME_WS_PORT', '8081');
$secret = env('REALTIME_PUBLISH_SECRET', 'lf-local-dev-secret');

$worker = new Worker("websocket://{$host}:{$port}");
$worker->name = 'LostAndFoundRealtime';

/** @var TcpConnection[] $clients keyed by connection id */
$clients = [];

$worker->onConnect = function (TcpConnection $connection) use (&$clients) {
    $clients[$connection->id] = $connection;
};
$worker->onClose = function (TcpConnection $connection) use (&$clients) {
    unset($clients[$connection->id]);
};
$worker->onMessage = function (TcpConnection $connection, $data) use (&$clients, $secret) {
    if ($data === 'ping') {
        $connection->send('pong');
        return;
    }

    $payload = json_decode($data, true);
    if (is_array($payload) && ($payload['secret'] ?? null) === $secret && !empty($payload['event'])) {
        // This is the PHP API publishing an event, not a browser. Relay
        // it to every OTHER connected client, then drop the publisher.
        $message = json_encode(['event' => $payload['event'], 'data' => $payload['data'] ?? []]);
        foreach ($clients as $id => $client) {
            if ($id !== $connection->id) {
                $client->send($message);
            }
        }
        $connection->close();
    }
    // Anything else from a real browser client is simply ignored —
    // this server is push-only from the app's point of view.
};

Worker::runAll();
