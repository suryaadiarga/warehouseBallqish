<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class MobileAppController extends Controller
{
    public function version(): JsonResponse
    {
        $relativePath = ltrim((string) config('mobile_app.apk_path'), '/');
        $absolutePath = public_path($relativePath);

        return $this->successResponse([
            'version_name' => (string) config('mobile_app.version_name'),
            'version_code' => (int) config('mobile_app.version_code'),
            'minimum_version_code' => (int) config('mobile_app.minimum_version_code'),
            'download_url' => url($relativePath),
            'sha256' => config('mobile_app.sha256')
                ?: (is_file($absolutePath) ? hash_file('sha256', $absolutePath) : null),
            'release_notes' => (string) config('mobile_app.release_notes'),
        ], 'Informasi versi aplikasi berhasil diambil');
    }
}
