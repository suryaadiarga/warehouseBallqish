<?php

namespace Tests\Feature;

use Tests\TestCase;

class MobileAppVersionTest extends TestCase
{
    public function test_mobile_version_endpoint_is_public(): void
    {
        $this->getJson('/api/mobile/version')
            ->assertOk()
            ->assertJsonPath('data.version_code', 2)
            ->assertJsonStructure([
                'data' => [
                    'version_name',
                    'version_code',
                    'minimum_version_code',
                    'download_url',
                    'sha256',
                    'release_notes',
                ],
            ]);
    }
}
