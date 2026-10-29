<?php

/**
 * Posts controller.
 *
 * posts_index()   GET    /api/posts            feed list (filter/search/paginate)
 *                                               and ?stale=1 for the "Still Not
 *                                               Found" sidebar (Section 12.1 style
 *                                               long-pending list)
 * posts_show()    GET    /api/posts/:id         single post detail
 * posts_store()   POST   /api/posts             create (Section 11 flowchart)
 * posts_update()  PUT    /api/posts/:id         edit (owner or admin)
 * posts_destroy() DELETE /api/posts/:id         delete (owner or admin)
 * posts_report()  POST   /api/posts/:id/report  file a report
 * posts_resolve() PATCH  /api/posts/:id/resolve resolve + delete (Section 13 flowchart)
 */

function post_row_for_output(array $row): array
{
    return [
        'id'             => (int) $row['id'],
        'user_id'        => (int) $row['user_id'],
        'owner_name'     => $row['owner_name'] ?? null,
        'type'           => $row['type'],
        'item_name'      => $row['item_name'],
        'description'    => $row['description'],
        'image_url'      => $row['image_url'],
        'icon'           => $row['icon'],
        'location'       => $row['location'],
        'date_lost_found' => $row['date_lost_found'],
        'status'         => $row['status'],
        'created_at'     => $row['created_at'],
        'days_pending'   => isset($row['days_pending']) ? (int) $row['days_pending'] : null,
    ];
}

function posts_index(): void
{
    $db = get_db();

    // "Still Not Found" sidebar: oldest pending posts, 30+ days old, capped at 20.
    if (isset($_GET['stale']) && $_GET['stale'] === '1') {
        $limit = (int) ($_GET['limit'] ?? 20);
        $limit = max(1, min(20, $limit));

        $stmt = $db->prepare(
            'SELECT p.*, u.name AS owner_name, DATEDIFF(NOW(), p.created_at) AS days_pending
             FROM posts p JOIN users u ON u.id = p.user_id
             WHERE p.status = "pending" AND DATEDIFF(NOW(), p.created_at) >= 30
             ORDER BY p.created_at ASC
             LIMIT :limit'
        );
        $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
        $stmt->execute();
        json_ok(['posts' => array_map('post_row_for_output', $stmt->fetchAll())]);
    }

    // Regular feed: filter by type, search text, paginate with offset/limit.
    // ?mine=1 restricts to the logged-in user's own posts (used by "My Posts").
    $type = $_GET['type'] ?? 'all';
    $search = trim($_GET['search'] ?? '');
    $offset = max(0, (int) ($_GET['offset'] ?? 0));
    $limit = max(1, min(100, (int) ($_GET['limit'] ?? 4)));
    $mineOnly = isset($_GET['mine']) && $_GET['mine'] === '1';

    $where = ['p.status = "pending"'];
    $params = [];

    if ($mineOnly) {
        $user = require_auth();
        $where[] = 'p.user_id = :user_id';
        $params[':user_id'] = $user['id'];
    }
    if ($type === 'lost' || $type === 'found') {
        $where[] = 'p.type = :type';
        $params[':type'] = $type;
    }
    if ($search !== '') {
        // Three distinct placeholders, not the same :search three times —
        // MySQL's native prepared statements (PDO::ATTR_EMULATE_PREPARES
        // false, see config/db.php) don't allow reusing one named
        // parameter more than once in a query. Reusing it threw
        // "SQLSTATE[HY093]: Invalid parameter number" on every search.
        $where[] = '(p.item_name LIKE :search1 OR p.description LIKE :search2 OR p.location LIKE :search3)';
        $searchTerm = '%' . $search . '%';
        $params[':search1'] = $searchTerm;
        $params[':search2'] = $searchTerm;
        $params[':search3'] = $searchTerm;
    }

    $sql = 'SELECT p.*, u.name AS owner_name FROM posts p JOIN users u ON u.id = p.user_id
            WHERE ' . implode(' AND ', $where) . '
            ORDER BY p.created_at DESC
            LIMIT :limit OFFSET :offset';
    $stmt = $db->prepare($sql);
    foreach ($params as $key => $value) {
        $stmt->bindValue($key, $value);
    }
    $stmt->bindValue(':limit', $limit, PDO::PARAM_INT);
    $stmt->bindValue(':offset', $offset, PDO::PARAM_INT);
    $stmt->execute();

    json_ok(['posts' => array_map('post_row_for_output', $stmt->fetchAll())]);
}

function posts_show(int $id): void
{
    $stmt = get_db()->prepare(
        'SELECT p.*, u.name AS owner_name FROM posts p JOIN users u ON u.id = p.user_id WHERE p.id = ?'
    );
    $stmt->execute([$id]);
    $post = $stmt->fetch();
    if (!$post) {
        json_error('Post not found.', 404);
    }
    json_ok(['post' => post_row_for_output($post)]);
}

function posts_store(): void
{
    $user = require_auth();

    // If the whole request exceeds post_max_size, PHP drops $_POST and
    // $_FILES entirely — which otherwise looks like a bogus "Type must be
    // lost or found" error.
    if (empty($_POST) && empty($_FILES) && (int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
        json_error('The upload is too large for the server (post_max_size is '
            . ini_get('post_max_size') . '). Try a smaller photo.', 413);
    }

    $type = $_POST['type'] ?? '';
    $itemName = trim($_POST['item_name'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $location = trim($_POST['location'] ?? '');
    $date = $_POST['date_lost_found'] ?? '';
    $icon = $_POST['icon'] ?? '🏷️';

    if (!in_array($type, ['lost', 'found'], true)) {
        json_error('Type must be "lost" or "found".', 422);
    }
    if ($itemName === '' || $description === '' || $location === '' || $date === '') {
        json_error('Please fill in item name, description, location, and date.', 422);
    }

    // Section 7.2: upload to ImgBB if a photo was attached and a key is
    // configured; otherwise fall back to the chosen icon (see imgbb.php).
    $imageUrl = null;
    if (isset($_FILES['image']) && $_FILES['image']['error'] !== UPLOAD_ERR_NO_FILE) {
        if ($_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            json_error(upload_error_message((int) $_FILES['image']['error']), 422);
        }
        if (!is_uploaded_file($_FILES['image']['tmp_name'])) {
            json_error('The photo upload was not valid. Please try again.', 400);
        }
        $uploadError = null;
        $imageUrl = upload_to_imgbb($_FILES['image']['tmp_name'], $uploadError, $_FILES['image']['name'] ?? null);
        if ($imageUrl === null && $uploadError !== null) {
            // Fail loudly instead of silently saving the post without its photo.
            json_error('Photo upload failed. ' . $uploadError, 502);
        }
    }

    $stmt = get_db()->prepare(
        'INSERT INTO posts (user_id, type, item_name, description, image_url, icon, location, date_lost_found, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, "pending")'
    );
    $stmt->execute([$user['id'], $type, $itemName, $description, $imageUrl, $icon, $location, $date]);
    $newId = (int) get_db()->lastInsertId();

    notify_realtime('posts_changed', ['reason' => 'created', 'id' => $newId]);
    posts_show($newId);
}

function posts_update(int $id): void
{
    $user = require_auth();
    $data = json_body();

    $stmt = get_db()->prepare('SELECT * FROM posts WHERE id = ?');
    $stmt->execute([$id]);
    $post = $stmt->fetch();
    if (!$post) {
        json_error('Post not found.', 404);
    }
    if ((int) $post['user_id'] !== (int) $user['id'] && $user['role'] !== 'admin') {
        json_error('You can only edit your own posts.', 403);
    }

    $type = in_array($data['type'] ?? '', ['lost', 'found'], true) ? $data['type'] : $post['type'];
    $itemName = trim($data['item_name'] ?? $post['item_name']);
    $description = trim($data['description'] ?? $post['description']);
    $location = trim($data['location'] ?? $post['location']);
    $date = $data['date_lost_found'] ?? $post['date_lost_found'];
    $icon = $data['icon'] ?? $post['icon'];

    if ($itemName === '' || $description === '' || $location === '' || $date === '') {
        json_error('Please fill in item name, description, location, and date.', 422);
    }

    $update = get_db()->prepare(
        'UPDATE posts SET type=?, item_name=?, description=?, location=?, date_lost_found=?, icon=? WHERE id=?'
    );
    $update->execute([$type, $itemName, $description, $location, $date, $icon, $id]);

    notify_realtime('posts_changed', ['reason' => 'updated', 'id' => $id]);
    posts_show($id);
}

function posts_destroy(int $id): void
{
    $user = require_auth();

    $stmt = get_db()->prepare('SELECT * FROM posts WHERE id = ?');
    $stmt->execute([$id]);
    $post = $stmt->fetch();
    if (!$post) {
        json_error('Post not found.', 404);
    }
    if ((int) $post['user_id'] !== (int) $user['id'] && $user['role'] !== 'admin') {
        json_error('You can only delete your own posts.', 403);
    }

    get_db()->prepare('DELETE FROM posts WHERE id = ?')->execute([$id]);
    notify_realtime('posts_changed', ['reason' => 'deleted', 'id' => $id]);
    json_ok(['message' => 'Post deleted.']);
}

function posts_report(int $id): void
{
    $user = require_auth();
    $data = json_body();
    $reason = trim($data['reason'] ?? '');
    if ($reason === '') {
        json_error('Please describe why you are reporting this post.', 422);
    }

    $stmt = get_db()->prepare('SELECT * FROM posts WHERE id = ?');
    $stmt->execute([$id]);
    $post = $stmt->fetch();
    if (!$post) {
        json_error('Post not found.', 404);
    }

    $insert = get_db()->prepare(
        'INSERT INTO reports (post_id, reporter_id, post_title, reason, status) VALUES (?, ?, ?, ?, "pending")'
    );
    $insert->execute([$id, $user['id'], $post['item_name'], $reason]);

    notify_realtime('reports_changed', ['reason' => 'created']);
    json_ok(['message' => 'Report submitted for administrator review.'], 201);
}

function posts_resolve(int $id): void
{
    $user = require_auth();
    $data = json_body();

    $stmt = get_db()->prepare('SELECT * FROM posts WHERE id = ?');
    $stmt->execute([$id]);
    $post = $stmt->fetch();
    if (!$post) {
        json_error('Post not found.', 404);
    }
    if ((int) $post['user_id'] !== (int) $user['id'] && $user['role'] !== 'admin') {
        json_error('Only the post owner can mark it as resolved.', 403);
    }

    // Section 13: only delete once possession has actually been confirmed.
    if (empty($data['confirmed'])) {
        json_ok(['message' => 'Post kept as pending.', 'deleted' => false]);
    }

    $db = get_db();
    $db->beginTransaction();
    try {
        $db->prepare('INSERT INTO resolved_log (post_id, item_name, type) VALUES (?, ?, ?)')
            ->execute([$post['id'], $post['item_name'], $post['type']]);
        $db->prepare('DELETE FROM posts WHERE id = ?')->execute([$id]);
        $db->commit();
    } catch (Exception $e) {
        $db->rollBack();
        json_error('Could not resolve this post. Please try again.', 500);
    }

    notify_realtime('posts_changed', ['reason' => 'resolved', 'id' => $id]);
    json_ok(['message' => 'Item resolved — post removed from the board.', 'deleted' => true]);
}
