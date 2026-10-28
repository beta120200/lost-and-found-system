<?php
/**
 * Uploads an image to ImgBB (Section 7.2) and returns the direct URL
 * ImgBB hands back. The backend never stores the photo itself — only this
 * URL, saved by the caller into posts.image_url, matching Figure 2 in the doc.
 *
 * Return value:
 *   - string  -> the uploaded image's URL
 *   - null    -> no upload happened. If $error is still null, that just means
 *                "no key configured" (the caller falls back to the emoji icon).
 *                If $error is set, the upload was attempted and failed, and
 *                $error holds a human-readable reason.
 */
function upload_to_imgbb(string $tmpFilePath, ?string &$error = null, ?string $originalName = null): ?string {
    $error = null;

    if (!defined('IMGBB_API_KEY') || IMGBB_API_KEY === '') {
        return null; // not configured: icon fallback, not an error
    }
    if (!function_exists('curl_init')) {
        $error = 'The PHP cURL extension is disabled. In php.ini, remove the ";" before "extension=curl" and restart Apache.';
        return null;
    }

    // Make sure what we're sending really is an image, and learn its type.
    $info = @getimagesize($tmpFilePath);
    if ($info === false || empty($info['mime'])) {
        $error = 'That file is not a valid image (use JPG, PNG, GIF, WEBP or BMP).';
        return null;
    }
    $mime = $info['mime'];
    $ext  = image_type_to_extension($info[2], false) ?: 'jpg';
    $base = $originalName ? pathinfo($originalName, PATHINFO_FILENAME) : 'photo';
    $base = preg_replace('/[^A-Za-z0-9_-]+/', '_', $base) ?: 'photo';
    $uploadName = $base . '.' . $ext;

    $ch = curl_init('https://api.imgbb.com/1/upload');
    $options = [
        CURLOPT_POST           => true,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CONNECTTIMEOUT => 15,
        CURLOPT_TIMEOUT        => 60, // phone photos can be several MB
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_SSL_VERIFYHOST => 2,
        CURLOPT_POSTFIELDS     => [
            'key'        => IMGBB_API_KEY,
            // Sent as a real file part (with its true MIME type and name)
            // rather than a base64 string — ImgBB then stores exactly the
            // bytes the user uploaded.
            'image'      => new CURLFile($tmpFilePath, $mime, $uploadName),
            'expiration' => IMGBB_EXPIRATION_SECONDS, // ~3 months, per Section 7.2
        ],
    ];

    // Windows/XAMPP usually has no CA bundle configured, which makes every
    // HTTPS request fail with "unable to get local issuer certificate".
    // Use a bundle if we can find one, otherwise fall back to the Windows
    // certificate store (needs PHP 8.2+ / a recent libcurl).
    $ca = imgbb_find_ca_bundle();
    if ($ca !== null) {
        $options[CURLOPT_CAINFO] = $ca;
    } elseif (DIRECTORY_SEPARATOR === '\\' && defined('CURLSSLOPT_NATIVE_CA')) {
        $options[CURLOPT_SSL_OPTIONS] = CURLSSLOPT_NATIVE_CA;
    }

    curl_setopt_array($ch, $options);
    $response = curl_exec($ch);
    $errno    = curl_errno($ch);
    $curlErr  = curl_error($ch);
    $httpCode = (int) curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($response === false) {
        $hint = '';
        if (in_array($errno, [60, 77, 35], true)) { // SSL cert problems
            $hint = ' (SSL certificate problem: download https://curl.se/ca/cacert.pem, save it as '
                  . 'api/config/cacert.pem, and try again.)';
        }
        $error = "Could not reach ImgBB: $curlErr$hint";
        error_log("ImgBB upload failed [curl $errno]: $curlErr");
        return null;
    }

    $json = json_decode($response, true);

    if ($httpCode !== 200 || !is_array($json) || empty($json['success'])) {
        $apiMsg = is_array($json) ? ($json['error']['message'] ?? null) : null;
        $error = 'ImgBB rejected the upload (HTTP ' . $httpCode . ')' . ($apiMsg ? ': ' . $apiMsg : '.');
        error_log('ImgBB upload rejected: HTTP ' . $httpCode . ' ' . substr((string) $response, 0, 300));
        return null;
    }

    $url = $json['data']['url'] ?? null;
    if (!$url) {
        $error = 'ImgBB answered successfully but did not return an image URL.';
        return null;
    }
    return $url;
}

/** Finds a CA certificate bundle that actually exists on this machine. */
function imgbb_find_ca_bundle(): ?string {
    $candidates = [
        ini_get('curl.cainfo'),
        ini_get('openssl.cafile'),
        __DIR__ . '/../config/cacert.pem',                // drop one here (see README)
        'C:/xampp/php/extras/ssl/cacert.pem',
        'C:/xampp/apache/bin/curl-ca-bundle.crt',
        'C:/laragon/etc/ssl/cacert.pem',
    ];
    if (function_exists('openssl_get_cert_locations')) {
        $loc = openssl_get_cert_locations();
        $candidates[] = $loc['default_cert_file'] ?? null;
    }
    foreach ($candidates as $path) {
        if ($path && is_file($path)) {
            return $path;
        }
    }
    return null;
}

/** Turns a PHP UPLOAD_ERR_* code into something a user can act on. */
function upload_error_message(int $code): string {
    switch ($code) {
        case UPLOAD_ERR_INI_SIZE:
            return 'That photo is larger than the server allows (upload_max_filesize is '
                 . ini_get('upload_max_filesize') . '). Try a smaller photo.';
        case UPLOAD_ERR_FORM_SIZE:
            return 'That photo is too large.';
        case UPLOAD_ERR_PARTIAL:
            return 'The photo only partly uploaded. Please try again.';
        case UPLOAD_ERR_NO_TMP_DIR:
        case UPLOAD_ERR_CANT_WRITE:
            return 'The server could not store the uploaded photo temporarily (check the PHP temp folder).';
        default:
            return 'The photo could not be uploaded (error code ' . $code . ').';
    }
}
