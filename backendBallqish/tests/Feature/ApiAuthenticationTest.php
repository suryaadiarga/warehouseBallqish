<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiAuthenticationTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_on_another_device_does_not_revoke_existing_token(): void
    {
        $user = User::factory()->create();
        $user->createToken('first-device');

        $this->postJson('/api/login', [
            'email' => $user->email,
            'password' => 'password',
        ])->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 2);
    }

    public function test_logout_revokes_only_the_current_device_token(): void
    {
        $user = User::factory()->create();
        $firstToken = $user->createToken('first-device')->plainTextToken;
        $user->createToken('second-device');

        $this->withToken($firstToken)
            ->postJson('/api/logout')
            ->assertOk();

        $this->assertDatabaseCount('personal_access_tokens', 1);
        $this->assertDatabaseHas('personal_access_tokens', [
            'name' => 'second-device',
            'tokenable_id' => $user->id,
        ]);
    }
}
