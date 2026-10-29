<?php

/**
 * Admin controller — Section 12 (Administrator Dashboard Flowchart) and
 * Table 7 (Dashboard Content). Every function here assumes require_admin()
 * has already been enforced by the router for this route.
 */

function admin_dashboard(): void
{
    $db = get_db();

    $totalUsers = (int) $db->query('SELECT COUNT(*) FROM users')->fetchColumn();
    $totalPosts = (int) $db->query('SELECT COUNT(*) FROM posts')->fetchColumn();
    $pendingReports = (int) $db->query("SELECT COUNT(*) FROM reports WHERE status = 'pending'")->fetchColumn();
    $resolvedItems = (int) $db->query('SELECT COUNT(*) FROM resolved_log')->fetchColumn();

    $recent = $db->query(
        'SELECT p.*, u.name AS owner_name FROM posts p JOIN users u ON u.id = p.user_id
         ORDER BY p.created_at DESC LIMIT 5'
    )->fetchAll();

    json_ok([
        'summary' => [
            'totalUsers'     => $totalUsers,
            'totalPosts'     => $totalPosts,
            'pendingReports' => $pendingReports,
            'resolvedItems'  => $resolvedItems,
        ],
        'recentPosts' => array_map('post_row_for_output', $recent),
    ]);
}

function admin_users(): void
{
    $rows = get_db()->query(
        'SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at ASC'
    )->fetchAll();

    $users = array_map(function ($u) {
        return [
            'id' => (int) $u['id'],
            'name' => $u['name'],
            'email' => $u['email'],
            'role' => $u['role'],
            'status' => $u['status'],
            'created_at' => $u['created_at'],
        ];
    }, $rows);

    json_ok(['users' => $users]);
}

/** Toggles a user's active/disabled status. Admin accounts can't be disabled. */
function admin_toggle_user(int $id): void
{
    $db = get_db();
    $stmt = $db->prepare('SELECT * FROM users WHERE id = ?');
    $stmt->execute([$id]);
    $target = $stmt->fetch();
    if (!$target) {
        json_error('User not found.', 404);
    }
    if ($target['role'] === 'admin') {
        json_error('Administrator accounts cannot be disabled.', 400);
    }

    $newStatus = $target['status'] === 'active' ? 'disabled' : 'active';
    $db->prepare('UPDATE users SET status = ? WHERE id = ?')->execute([$newStatus, $id]);

    notify_realtime('users_changed', ['reason' => 'status', 'id' => $id, 'status' => $newStatus]);
    json_ok(['message' => "Account status updated to {$newStatus}.", 'status' => $newStatus]);
}

function admin_posts(): void
{
    $rows = get_db()->query(
        'SELECT p.*, u.name AS owner_name FROM posts p JOIN users u ON u.id = p.user_id
         ORDER BY p.created_at DESC LIMIT 200'
    )->fetchAll();

    json_ok(['posts' => array_map('post_row_for_output', $rows)]);
}

function admin_reports(): void
{
    $rows = get_db()->query(
        'SELECT r.*, u.name AS reporter_name, p.id AS live_post_id
         FROM reports r
         JOIN users u ON u.id = r.reporter_id
         LEFT JOIN posts p ON p.id = r.post_id
         ORDER BY r.created_at DESC'
    )->fetchAll();

    $reports = array_map(function ($r) {
        return [
            'id'            => (int) $r['id'],
            'post_id'       => $r['live_post_id'] !== null ? (int) $r['live_post_id'] : null,
            'post_title'    => $r['post_title'],
            'reporter_name' => $r['reporter_name'],
            'reason'        => $r['reason'],
            'status'        => $r['status'],
            'created_at'    => $r['created_at'],
        ];
    }, $rows);

    json_ok(['reports' => $reports]);
}

function admin_dismiss_report(int $id): void
{
    $db = get_db();
    $stmt = $db->prepare('SELECT * FROM reports WHERE id = ?');
    $stmt->execute([$id]);
    $report = $stmt->fetch();
    if (!$report) {
        json_error('Report not found.', 404);
    }

    $db->prepare('UPDATE reports SET status = "dismissed" WHERE id = ?')->execute([$id]);
    notify_realtime('reports_changed', ['reason' => 'dismissed', 'id' => $id]);
    json_ok(['message' => 'Report dismissed.']);
}

/** Removes the reported post (if it still exists) and resolves the report. */
function admin_remove_reported_post(int $id): void
{
    $db = get_db();
    $stmt = $db->prepare('SELECT * FROM reports WHERE id = ?');
    $stmt->execute([$id]);
    $report = $stmt->fetch();
    if (!$report) {
        json_error('Report not found.', 404);
    }

    $db->beginTransaction();
    try {
        if ($report['post_id'] !== null) {
            $postStmt = $db->prepare('SELECT id, item_name, type FROM posts WHERE id = ?');
            $postStmt->execute([$report['post_id']]);
            $removedPost = $postStmt->fetch();

            if ($removedPost) {
                $db->prepare('INSERT INTO resolved_log (post_id, item_name, type) VALUES (?, ?, ?)')
                    ->execute([$removedPost['id'], $removedPost['item_name'], $removedPost['type']]);
                $db->prepare('DELETE FROM posts WHERE id = ?')->execute([$report['post_id']]);
            }
        }
        $db->prepare('UPDATE reports SET status = "resolved" WHERE id = ?')->execute([$id]);
        $db->commit();
    } catch (Exception $e) {
        $db->rollBack();
        json_error('Could not remove this post. Please try again.', 500);
    }

    notify_realtime('posts_changed', ['reason' => 'admin_removed', 'id' => $report['post_id']]);
    notify_realtime('reports_changed', ['reason' => 'resolved', 'id' => $id]);
    json_ok(['message' => 'Post removed and report resolved.']);
}
