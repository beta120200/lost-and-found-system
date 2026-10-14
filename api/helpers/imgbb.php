<?php
/**
 * Uploads an image to ImgBB (Section 7.2) and returns the direct URL
 * ImgBB hands back, or null if no key is configured / the upload fails.
 * The backend never stores the photo itself — only this URL, saved by
 * the caller into posts.image_url, matching Figure 2 in the doc.
 */
function upload_to_imgbb(string $tmpFilePath): ?string {
    if (!defined('IMGBB_API_KEY') || IMGBB_API_KEY === '') {
        return null;
    }
    if (!function_exists('curl_init')) {
        return null;
    }

    $imageData = @file_get_contents($tmpFilePath);
    if ($imageData === false) {
        return null;
    }

    $ch = curl_init('https://api.imgbb.com/1/upload');
    curl_setopt_array($ch, [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT        => 15,
        CURLOPT_POSTFIELDS     => [
            'key'        => IMGBB_API_KEY,
            'image'      => base64_encode($imageData),
            'expiration' => IMGBB_EXPIRATION_SECONDS, // ~3 months, per Section 7.2
        ],
    ]);
    $response = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false || $httpCode !== 200) {
        return null;
    }
    $json = json_decode($response, true);
    return $json['data']['url'] ?? null;
}
