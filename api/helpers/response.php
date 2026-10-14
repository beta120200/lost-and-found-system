<?php
/**
 * Small helpers for sending consistent JSON responses and reading the
 * request body. Kept framework-free per the documented tech stack
 * (Section 4): plain PHP, no external libraries.
 */

function json_ok($data = [], int $status = 200): void {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode(array_merge(['ok' => true], $data));
    exit;
}

function json_error(string $message, int $status = 400): void {
    http_response_code($status);
    header('Content-Type: application/json');
    echo json_encode(['ok' => false, 'message' => $message]);
    exit;
}

/** Reads and decodes a JSON request body into an associative array. */
function json_body(): array {
    $raw = file_get_contents('php://input');
    if ($raw === false || $raw === '') {
        return [];
    }
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

/**
 * Validates that each of $fields is present and non-empty (after
 * trimming strings) in $data. Returns a list of missing field names.
 */
function missing_fields(array $data, array $fields): array {
    $missing = [];
    foreach ($fields as $field) {
        $value = $data[$field] ?? null;
        if (is_string($value)) {
            $value = trim($value);
        }
        if ($value === null || $value === '') {
            $missing[] = $field;
        }
    }
    return $missing;
}
