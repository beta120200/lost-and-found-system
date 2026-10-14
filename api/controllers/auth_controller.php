<?php
/**
 * Auth controller — implements the Login and Role-Based Access flowchart
 * (Section 10) plus the equivalent signup flow. Role is always read from
 * the account itself; the client never gets to choose it.
 */

function auth_signup(): void {
    $data = json_body();
    $missing = missing_fields($data, ['name', 'email', 'password']);
    if ($missing) {
        json_error('Missing field(s): ' . implode(', ', $missing) . '.', 422);
    }

    $name = trim($data['name']);
    $email = strtolower(trim($data['email']));
    $password = (string) $data['password'];

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        json_error('Please enter a valid email address.', 422);
    }
    if (strlen($password) < 6) {
        json_error('Password must be at least 6 characters.', 422);
    }

    $db = get_db();
    $existing = $db->prepare('SELECT id FROM users WHERE email = ?');
    $existing->execute([$email]);
    if ($existing->fetch()) {
        json_error('An account with that email already exists.', 409);
    }

    // New accounts always get the standard "user" role — Section 5.
    $stmt = $db->prepare(
        'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, "user", "active")'
    );
    $stmt->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT)]);

    $userId = (int) $db->lastInsertId();
    log_in_user(['id' => $userId, 'role' => 'user']);

    json_ok(['user' => [
        'id' => $userId, 'name' => $name, 'email' => $email, 'role' => 'user', 'status' => 'active',
    ]], 201);
}

function auth_login(): void {
    $data = json_body();
    $missing = missing_fields($data, ['email', 'password']);
    if ($missing) {
        json_error('Please enter both your email and password.', 422);
    }

    $email = strtolower(trim($data['email']));
    $password = (string) $data['password'];

    $stmt = get_db()->prepare('SELECT * FROM users WHERE email = ?');
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    // Section 10: invalid credentials -> show an error, stay on the login step.
    if (!$user || !password_verify($password, $user['password_hash'])) {
        json_error('Incorrect email or password.', 401);
    }
    if ($user['status'] === 'disabled') {
        json_error('This account has been disabled by an administrator.', 403);
    }

    log_in_user($user);

    json_ok(['user' => [
        'id' => (int) $user['id'], 'name' => $user['name'], 'email' => $user['email'],
        'role' => $user['role'], 'status' => $user['status'],
    ]]);
}

function auth_logout(): void {
    log_out_user();
    json_ok();
}

/** Lets the frontend restore a session on page load/refresh. */
function auth_me(): void {
    $user = current_user();
    if (!$user) {
        json_error('Not logged in.', 401);
    }
    json_ok(['user' => [
        'id' => (int) $user['id'], 'name' => $user['name'], 'email' => $user['email'],
        'role' => $user['role'], 'status' => $user['status'],
    ]]);
}
