<?php

return [
    'version_name' => env('MOBILE_APP_VERSION_NAME', '1.0.1'),
    'version_code' => (int) env('MOBILE_APP_VERSION_CODE', 2),
    'minimum_version_code' => (int) env('MOBILE_APP_MINIMUM_VERSION_CODE', 1),
    'apk_path' => env('MOBILE_APP_APK_PATH', 'mobile/ballqish-latest.apk'),
    'sha256' => env('MOBILE_APP_SHA256'),
    'release_notes' => env(
        'MOBILE_APP_RELEASE_NOTES',
        'Pembaruan stabilitas, Analytics, FCM, dan autentikasi multi-perangkat.'
    ),
];
