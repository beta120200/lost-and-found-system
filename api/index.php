<?php
/**
 * Front controller for the Lost and Found REST API (Section 14).
 *
 * Every request to /api/* is rewritten here by .htaccess. This file
 * figures out which route was requested and calls the matching
 * controller function. No framework — a small router is enough for
 * the handful of documented endpoints (Section 4: plain PHP).
 */

require __DIR__ . '/config/db.php';
require __DIR__ . '/config/imgbb.php';
require __DIR__ . '/helpers/response.php';
require __DIR__ . '/helpers/auth.php';
require __DIR__ . '/helpers/imgbb.php';
require __DIR__ . '/helpers/realtime.php';
require __DIR__ . '/controllers/auth_controller.php';
require __DIR__ . '/controllers/posts_controller.php';
require __DIR__ . '/controllers/admin_controller.php';

start_session();

/**
 * Work out the path relative to this api/ folder, e.g. a request to
 * ".../lost-and-found-system/api/posts/5/resolve" becomes
 * ["posts", "5", "resolve"] regardless of what the project folder is
 * named on this machine.
 */
$scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'])), '/');
$requestPath = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if ($scriptDir !== '' && strpos($requestPath, $scriptDir) === 0) {
    $requestPath = substr($requestPath, strlen($scriptDir));
}
$requestPath = trim($requestPath, '/');
$segments = $requestPath === '' ? [] : explode('/', $requestPath);
$method = $_SERVER['REQUEST_METHOD'];

try {
    route_request($method, $segments);
    json_error('Not found.', 404);
} catch (Throwable $e) {
    json_error('Unexpected server error: ' . $e->getMessage(), 500);
}

function route_request(string $method, array $segments): void {
    $resource = $segments[0] ?? '';

    if ($resource === 'auth') {
        $action = $segments[1] ?? '';
        if ($method === 'POST' && $action === 'signup') { auth_signup(); }
        if ($method === 'POST' && $action === 'login')  { auth_login(); }
        if ($method === 'POST' && $action === 'logout') { auth_logout(); }
        if ($method === 'GET'  && $action === 'me')     { auth_me(); }
        return;
    }

    if ($resource === 'posts') {
        $id  = isset($segments[1]) && ctype_digit($segments[1]) ? (int) $segments[1] : null;
        $sub = $segments[2] ?? null;

        if ($method === 'GET'    && $id === null)                    { posts_index(); }
        if ($method === 'GET'    && $id !== null && $sub === null)   { posts_show($id); }
        if ($method === 'POST'   && $id === null)                    { posts_store(); }
        if ($method === 'PUT'    && $id !== null && $sub === null)   { posts_update($id); }
        if ($method === 'DELETE' && $id !== null && $sub === null)   { posts_destroy($id); }
        if ($method === 'POST'   && $id !== null && $sub === 'report')  { posts_report($id); }
        if ($method === 'PATCH'  && $id !== null && $sub === 'resolve') { posts_resolve($id); }
        return;
    }

    if ($resource === 'admin') {
        require_admin(); // Section 5: every admin route is re-checked server-side.

        $section = $segments[1] ?? '';
        $id  = isset($segments[2]) && ctype_digit($segments[2]) ? (int) $segments[2] : null;
        $sub = $segments[3] ?? null;

        if ($method === 'GET'   && $section === 'dashboard')                     { admin_dashboard(); }
        if ($method === 'GET'   && $section === 'users')                         { admin_users(); }
        if ($method === 'PATCH' && $section === 'users'   && $id !== null)       { admin_toggle_user($id); }
        if ($method === 'GET'   && $section === 'posts')                         { admin_posts(); }
        if ($method === 'GET'   && $section === 'reports')                       { admin_reports(); }
        if ($method === 'PATCH' && $section === 'reports' && $id !== null && $sub === 'dismiss')     { admin_dismiss_report($id); }
        if ($method === 'PATCH' && $section === 'reports' && $id !== null && $sub === 'remove-post') { admin_remove_reported_post($id); }
        return;
    }
}
