<?php
/**
 * ImgBB configuration — Section 7.2 (Image Hosting Integration with ImgBB).
 *
 * The documented design uploads each post photo to ImgBB and stores only
 * the returned direct URL (image_url) — the app server never stores the
 * file itself. ImgBB requires a free API key to accept uploads.
 *
 * The key lives in .env (IMGBB_API_KEY), not in this file, so it's never
 * committed by accident. Copy .env.example to .env and fill it in:
 *   1. Create a free account at https://api.imgbb.com/
 *   2. Copy your API key into .env
 *
 * If it's left blank, the app still works — posts_controller.php falls
 * back to the emoji icon the user picks in the form instead of a real
 * photo, so the system is fully usable without an ImgBB account.
 */

require_once __DIR__ . '/../helpers/env.php';
load_env(__DIR__ . '/../../.env');

define('IMGBB_API_KEY', env('IMGBB_API_KEY', ''));

// 3 months, in seconds — matches the "3-month expiration" described in
// Section 7.2 and Section 8.2. ImgBB accepts 60–15552000 seconds.
define('IMGBB_EXPIRATION_SECONDS', (int) env('IMGBB_EXPIRATION_SECONDS', 7776000));
