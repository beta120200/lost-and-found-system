<?php
/**
 * Session-based authentication helpers.
 *
 * Section 5 (User Roles and Permissions) requires role checks to happen
 * on the server, not just the client — every protected endpoint in this
 * API calls require_auth() or require_admin() before doing anything else,
 * so role separation can't be bypassed by editing frontend JavaScript.
 */

function start_session(): void {
    if (session_status() !== PHP_SESSION_ACTIVE) {
        session_start();
    }
}

function log_in_user(array $user): void {
    start_session();
    session_regenerate_id(true);
    $_SESSION['user_id'] = (int) $user['id'];
    $_SESSION['role']    = $user['role'];
}

function log_out_user(): void {
    start_session();
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000, $params['path'], $params['domain'], $params['secure'], $params['httponly']);
    }
    session_destroy();
}

/** Returns the logged-in user's full row (minus password_hash), or null. */
function current_user(): ?array {
    start_session();
    if (empty($_SESSION['user_id'])) {
        return null;
    }
    $stmt = get_db()->prepare('SELECT id, name, email, role, status, created_at FROM users WHERE id = ?');
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch();
    return $user ?: null;
}

/** Ends the request with a 401 if nobody is logged in. Returns the user otherwise. */
function require_auth(): array {
    $user = current_user();
    if (!$user) {
        json_error('Please log in to continue.', 401);
    }
    if ($user['status'] === 'disabled') {
        json_error('This account has been disabled by an administrator.', 403);
    }
    return $user;
}

/** Ends the request with a 403 unless the logged-in user is an admin. */
function require_admin(): array {
    $user = require_auth();
    if ($user['role'] !== 'admin') {
        json_error('Administrator access required.', 403);
    }
    return $user;
}
