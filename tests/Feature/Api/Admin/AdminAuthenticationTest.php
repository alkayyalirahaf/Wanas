<?php

namespace Tests\Feature\Api\Admin;

use App\Models\User;

class AdminAuthenticationTest extends AdminApiTestCase
{
    public function test_active_admin_can_log_in_and_receive_a_sanctum_token(): void
    {
        $response = $this->postJson('/api/admin/login', [
            'email' => $this->admin->email,
            'password' => 'password',
        ]);

        $response->assertOk()->assertJsonPath('admin.role', 'admin')->assertJsonStructure(['token']);
    }

    public function test_invalid_credentials_and_non_active_or_non_admin_accounts_cannot_log_in(): void
    {
        $this->postJson('/api/admin/login', ['email' => $this->admin->email, 'password' => 'wrong'])
            ->assertUnauthorized();

        foreach ([['role' => 'member', 'status' => 'Active'], ['role' => 'admin', 'status' => 'Blocked']] as $state) {
            $user = User::factory()->state($state)->create();
            $this->postJson('/api/admin/login', ['email' => $user->email, 'password' => 'password'])
                ->assertUnauthorized();
        }
    }

    public function test_login_validates_required_credentials(): void
    {
        $this->postJson('/api/admin/login', [])->assertUnprocessable()
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_active_admin_can_logout_using_issued_token(): void
    {
        $login = $this->postJson('/api/admin/login', ['email' => $this->admin->email, 'password' => 'password']);
        $token = $login->json('token');

        $this->withToken($token)->postJson('/api/admin/logout')->assertOk();
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $this->admin->id]);
    }
}
