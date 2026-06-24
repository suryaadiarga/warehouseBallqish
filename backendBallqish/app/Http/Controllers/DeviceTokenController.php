<?php

namespace App\Http\Controllers;

use App\Models\DeviceToken;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class DeviceTokenController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'token' => ['required', 'string', 'max:4096'],
            'platform' => ['nullable', 'string', Rule::in(['android', 'ios', 'web', 'unknown'])],
            'device_name' => ['nullable', 'string', 'max:255'],
        ]);

        $deviceToken = DeviceToken::query()->updateOrCreate(
            ['token_hash' => hash('sha256', $validated['token'])],
            [
                'user_id' => $request->user()->id,
                'token' => $validated['token'],
                'platform' => $validated['platform'] ?? 'unknown',
                'device_name' => $validated['device_name'] ?? null,
                'last_used_at' => now(),
            ],
        );

        return $this->successResponse($deviceToken, 'Device token berhasil disimpan');
    }

    public function destroy(Request $request)
    {
        $validated = $request->validate([
            'token' => ['required', 'string', 'max:4096'],
        ]);

        DeviceToken::query()
            ->where('user_id', $request->user()->id)
            ->where('token_hash', hash('sha256', $validated['token']))
            ->delete();

        return $this->successResponse(null, 'Device token berhasil dihapus');
    }
}
