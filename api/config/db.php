<?php
/**
 * Database connection — Section 4 (Technology Stack): MySQL via PHP's
 * PDO extension. Reads from the project's .env file (copy .env.example
 * to .env and edit it); falls back to a fresh XAMPP install's defaults
 * (host 127.0.0.1, user "root", empty password) if .env is missing.
 */

require_once __DIR__ . '/../helpers/env.php';
load_env(__DIR__ . '/../../.env');

define('DB_HOST', env('DB_HOST', '127.0.0.1'));
define('DB_NAME', env('DB_NAME', 'lost_and_found'));
define('DB_USER', env('DB_USER', 'root'));
define('DB_PASS', env('DB_PASS', ''));
define('DB_CHARSET', 'utf8mb4');

function get_db(): PDO {
    static $pdo = null;
    if ($pdo !== null) {
        return $pdo;
    }

    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=' . DB_CHARSET;
    try {
        $pdo = new PDO($dsn, DB_USER, DB_PASS, [
            PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES   => false,
        ]);
    } catch (PDOException $e) {
        http_response_code(500);
        header('Content-Type: application/json');
        echo json_encode([
            'ok'      => false,
            'message' => 'Could not connect to the database. Make sure MySQL is running in '
                       . 'XAMPP and that you have imported database/schema.sql.',
        ]);
        exit;
    }

    return $pdo;
}
