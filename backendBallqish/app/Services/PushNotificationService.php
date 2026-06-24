<?php

namespace App\Services;

use App\Models\DeviceToken;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class PushNotificationService
{
    private const FIREBASE_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging';
    private const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';

    public function sendToUsers(EloquentCollection|Collection $users, string $title, string $body, array $data = []): void
    {
        if (! $this->configured()) {
            return;
        }

        $tokens = DeviceToken::query()
            ->whereIn('user_id', $users->pluck('id')->unique()->values())
            ->get();

        foreach ($tokens as $deviceToken) {
            $this->sendToToken($deviceToken, $title, $body, $data);
        }
    }

    private function sendToToken(DeviceToken $deviceToken, string $title, string $body, array $data): void
    {
        try {
            $response = Http::withToken($this->accessToken())
                ->timeout(10)
                ->post($this->messageUrl(), [
                    'message' => [
                        'token' => $deviceToken->token,
                        'notification' => [
                            'title' => $title,
                            'body' => $body,
                        ],
                        'data' => $this->stringifyData($data),
                        'android' => [
                            'priority' => 'high',
                            'notification' => [
                                'channel_id' => 'stock_transfer',
                                'sound' => 'default',
                            ],
                        ],
                    ],
                ]);

            if ($response->status() === 404 || $response->status() === 400) {
                $deviceToken->delete();
                return;
            }

            if ($response->failed()) {
                Log::warning('FCM push notification failed.', [
                    'status' => $response->status(),
                    'body' => $response->body(),
                ]);
            }
        } catch (\Throwable $exception) {
            Log::warning('FCM push notification skipped.', [
                'message' => $exception->getMessage(),
            ]);
        }
    }

    private function accessToken(): string
    {
        return Cache::remember('firebase_messaging_access_token', 3300, function () {
            $response = Http::asForm()
                ->timeout(10)
                ->post(self::GOOGLE_TOKEN_URL, [
                    'grant_type' => 'urn:ietf:params:oauth:grant-type:jwt-bearer',
                    'assertion' => $this->jwtAssertion(),
                ]);

            $response->throw();

            return $response->json('access_token');
        });
    }

    private function jwtAssertion(): string
    {
        $now = time();
        $header = $this->base64UrlEncode(json_encode([
            'alg' => 'RS256',
            'typ' => 'JWT',
        ], JSON_THROW_ON_ERROR));

        $payload = $this->base64UrlEncode(json_encode([
            'iss' => config('services.firebase.client_email'),
            'scope' => self::FIREBASE_SCOPE,
            'aud' => self::GOOGLE_TOKEN_URL,
            'iat' => $now,
            'exp' => $now + 3600,
        ], JSON_THROW_ON_ERROR));

        $unsigned = "{$header}.{$payload}";
        $privateKey = str_replace('\\n', "\n", (string) config('services.firebase.private_key'));
        openssl_sign($unsigned, $signature, $privateKey, OPENSSL_ALGO_SHA256);

        return "{$unsigned}.{$this->base64UrlEncode($signature)}";
    }

    private function messageUrl(): string
    {
        return 'https://fcm.googleapis.com/v1/projects/'.config('services.firebase.project_id').'/messages:send';
    }

    private function configured(): bool
    {
        return filled(config('services.firebase.project_id'))
            && filled(config('services.firebase.client_email'))
            && filled(config('services.firebase.private_key'));
    }

    private function stringifyData(array $data): array
    {
        return collect($data)
            ->mapWithKeys(fn ($value, $key) => [(string) $key => (string) $value])
            ->all();
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}
