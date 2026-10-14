<?php
/**
 * Demo data seeder. Open this file once in your browser
 * (e.g. http://localhost/lost-and-found-system/api/seed.php) after
 * importing database/schema.sql. It creates three demo accounts and a
 * batch of demo posts — some recent, some aged 30+ days so the "Still
 * Not Found" sidebar has something to show immediately.
 *
 * Safe to run only once: it checks whether users already exist and
 * refuses to run again if so, so you won't get duplicate demo data.
 */

require __DIR__ . '/config/db.php';

header('Content-Type: text/plain; charset=utf-8');

$db = get_db();

$existing = (int) $db->query('SELECT COUNT(*) FROM users')->fetchColumn();
if ($existing > 0) {
    echo "Already seeded — {$existing} user(s) already exist, so nothing was changed.\n";
    echo "If you want a clean slate, drop and re-import database/schema.sql first.\n";
    exit;
}

function days_ago_datetime(int $days): string {
    return (new DateTime("-{$days} days"))->format('Y-m-d H:i:s');
}
function days_ago_date(int $days): string {
    return (new DateTime("-{$days} days"))->format('Y-m-d');
}

$db->beginTransaction();
try {
    // ---- Demo accounts -------------------------------------------------
    $insertUser = $db->prepare(
        'INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, "active")'
    );

    $insertUser->execute(['Maria Santos', 'maria@icct.edu.ph', password_hash('password123', PASSWORD_DEFAULT), 'user']);
    $mariaId = (int) $db->lastInsertId();

    $insertUser->execute(['Jake Rivera', 'jake@icct.edu.ph', password_hash('password123', PASSWORD_DEFAULT), 'user']);
    $jakeId = (int) $db->lastInsertId();

    $insertUser->execute(['Ms. Cruz', 'admin@icct.edu.ph', password_hash('admin123', PASSWORD_DEFAULT), 'admin']);
    $adminId = (int) $db->lastInsertId();

    // ---- Demo posts ------------------------------------------------------
    // [ownerId, type, item_name, description, location, icon, daysAgo]
    $posts = [
        [$mariaId, 'lost',  'Black Leather Wallet', 'Bi-fold wallet, contains a student ID and a couple of cards. Last had it at the counter.', 'Canteen, 2nd Floor', '💳', 9],
        [$jakeId,  'found', 'Keys with Blue Lanyard', 'Small bunch of keys, one looks like a padlock key, on a blue lanyard.', 'Gymnasium Entrance', '🔑', 6],
        [$mariaId, 'lost',  'Silver Wristwatch', 'Simple silver analog watch with a leather strap, slightly scratched glass.', 'Room 301', '⌚', 14],
        [$jakeId,  'found', 'Red USB Flash Drive', '16GB flash drive, red casing, no labels on it.', 'Computer Lab 2', '💾', 5],
        [$mariaId, 'lost',  'Grey Backpack', 'Grey canvas backpack with a laptop sleeve and a small keychain charm.', 'Library, Ground Floor', '🎒', 12],
        [$jakeId,  'found', 'Wired Earphones', 'White wired earphones, tangled, found tucked under a chair.', 'Lecture Hall B', '🎧', 4],
        [$mariaId, 'lost',  'Chemistry Textbook', 'General Chemistry textbook, name written inside the front cover.', 'Room 214', '📘', 16],
        [$jakeId,  'found', 'Green Water Bottle', 'Stainless steel water bottle, dark green, some stickers on it.', 'Parking Lot', '🧴', 3],
        // Long-pending (30+ days) — populate the "Still Not Found" sidebar.
        [$mariaId, 'lost',  'Faded Green Umbrella', 'Compact folding umbrella, faded green fabric, bent tip on one rib.', 'Bus Stop Near Gate 2', '☂️', 122],
        [$jakeId,  'lost',  'Old Physics Notebook', 'Spiral notebook full of problem sets, name written on the first page.', 'Room 210', '📘', 114],
        [$mariaId, 'found', 'Small Silver Stud Earring', 'Single silver stud earring, found near the sinks.', 'Library Restroom', '💠', 106],
        [$jakeId,  'found', 'Black Phone Case', 'Plain black silicone phone case, no phone inside, mid-size model.', 'Canteen', '📱', 98],
        [$mariaId, 'lost',  'Grey Hoodie', 'Plain grey pullover hoodie, size medium, left on a bench.', 'Gym Locker Room', '🧥', 91],
        [$jakeId,  'found', 'White Portable Charger', 'Small white power bank, one usb port, no cable with it.', 'Computer Lab 1', '🔋', 84],
        [$mariaId, 'lost',  'Blue Ballpen Set', 'Set of three blue ballpens in a clear pouch, class name on the pouch.', 'Room 305', '🖊️', 76],
        [$jakeId,  'found', 'Prescription Eyeglasses', 'Black-framed prescription glasses in a soft case, no name on the case.', 'Faculty Office Hallway', '👓', 68],
        [$mariaId, 'lost',  'Maroon Scarf', 'Knitted maroon scarf, dropped somewhere near the main gate.', 'Main Entrance', '🧣', 61],
        [$jakeId,  'found', 'Wireless Mouse', 'Black wireless mouse, no receiver, left plugged into a charging cable.', 'Computer Lab 2', '🖱️', 53],
        [$mariaId, 'lost',  'Student ID Lanyard', 'Blue lanyard with a clip, no ID card attached anymore.', 'Parking Lot', '🪪', 45],
        [$jakeId,  'found', 'Small Coin Purse', 'Small brown coin purse with a zipper, a few coins inside.', 'Canteen', '👛', 37],
        [$mariaId, 'lost',  'Denim Jacket', 'Light-wash denim jacket, size small, left draped over a chair.', 'Lecture Hall A', '🧥', 32],
    ];

    $insertPost = $db->prepare(
        'INSERT INTO posts (user_id, type, item_name, description, icon, location, date_lost_found, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, "pending", ?)'
    );
    $postIds = [];
    foreach ($posts as $p) {
        [$ownerId, $type, $name, $desc, $location, $icon, $daysAgo] = $p;
        $insertPost->execute([
            $ownerId, $type, $name, $desc, $icon, $location,
            days_ago_date($daysAgo), days_ago_datetime($daysAgo),
        ]);
        $postIds[$name] = (int) $db->lastInsertId();
    }

    // ---- Demo reports ------------------------------------------------
    $insertReport = $db->prepare(
        'INSERT INTO reports (post_id, reporter_id, post_title, reason, status, created_at) VALUES (?, ?, ?, ?, "pending", ?)'
    );
    $insertReport->execute([
        $postIds['Keys with Blue Lanyard'], $mariaId, 'Keys with Blue Lanyard',
        'I think these are my keys — please verify with the finder.', days_ago_datetime(5),
    ]);
    $insertReport->execute([
        $postIds['Wired Earphones'], $mariaId, 'Wired Earphones',
        'Duplicate of another found post from the same day.', days_ago_datetime(4),
    ]);

    // ---- A little resolution history, so the dashboard isn't at zero --
    $resolvedSamples = [
        ['Blue Umbrella', 'lost', 140], ['Brown Sling Bag', 'found', 133], ['Set of Classroom Keys', 'found', 128],
        ['Yellow Raincoat', 'lost', 120], ['Scientific Calculator', 'lost', 110], ['Pair of Earbuds', 'found', 102],
        ['School ID (Laminated)', 'found', 95], ['Red Water Jug', 'lost', 88], ['Charger Brick', 'found', 80],
        ['Spiral Notebook', 'lost', 70], ['Black Cap', 'found', 60], ['Hair Clip Set', 'found', 50],
        ['Metal Water Bottle', 'lost', 40], ['Pencil Case', 'found', 25],
    ];
    $insertResolved = $db->prepare('INSERT INTO resolved_log (item_name, type, resolved_at) VALUES (?, ?, ?)');
    foreach ($resolvedSamples as [$name, $type, $daysAgo]) {
        $insertResolved->execute([$name, $type, days_ago_datetime($daysAgo)]);
    }

    $db->commit();
} catch (Exception $e) {
    $db->rollBack();
    echo "Seeding failed: " . $e->getMessage() . "\n";
    exit;
}

echo "Seed complete.\n\n";
echo "Demo accounts:\n";
echo "  User (Maria Santos)  maria@icct.edu.ph / password123\n";
echo "  User (Jake Rivera)   jake@icct.edu.ph  / password123\n";
echo "  Admin (Ms. Cruz)     admin@icct.edu.ph / admin123\n\n";
echo count($posts) . " posts, 2 reports, " . count($resolvedSamples) . " resolved-history entries created.\n\n";
echo "You can now open the app's index.html and log in with any of the accounts above.\n";
