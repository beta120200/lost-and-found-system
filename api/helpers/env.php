<?php
/**
 * Minimal .env loader. Deliberately not a Composer package — parsing
 * KEY=VALUE lines doesn't need a dependency, so this keeps Composer
 * scoped to the one thing that actually benefits from a real library:
 * Workerman, for live updates (see realtime/server.php).
 */

function load_env(string $path): void {
    static $loaded = [];
    if (isset($loaded[$path])) {
        return;
    }
    $loaded[$path] = true;

    if (!is_file($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || $line[0] === '#' || strpos($line, '=') === false) {
            continue;
        }
        [$key, $value] = explode('=', $line, 2);
        $key = trim($key);
        $value = trim($value);

        $len = strlen($value);
        if ($len >= 2 && (($value[0] === '"' && $value[$len - 1] === '"') || ($value[0] === "'" && $value[$len - 1] === "'"))) {
            $value = substr($value, 1, -1);
        }

        if (!array_key_exists($key, $_ENV)) {
            $_ENV[$key] = $value;
            putenv($key . '=' . $value);
        }
    }
}

/** Reads a value loaded by load_env(), with a fallback default. */
function env(string $key, $default = null) {
    if (array_key_exists($key, $_ENV)) {
        return $_ENV[$key];
    }
    $fromGetenv = getenv($key);
    return $fromGetenv !== false ? $fromGetenv : $default;
}
