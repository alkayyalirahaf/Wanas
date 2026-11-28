<?php

namespace Tests\Feature\Api\Admin;

use App\Models\User;

class UserManagementTest extends AdminApiTestCase
{
    public function test_users_support_search_role_status_pagination_and_validation(): void
    {
        User::factory()->create(['name' => 'Searchable Member', 'role' => 'member', 'status' => 'Active']);
        User::factory()->specialistRole('Pending')->create();
        $this->asAdmin()->getJson('/api/admin/users?search=Searchable&role=member&status=Active&per_page=10')
            ->assertOk()->assertJsonPath('data.total', 1);
        $this->asAdmin()->getJson('/api/admin/users?role=invalid')->assertUnprocessable();
    }

    public function test_block_unblock_and_soft_delete_restore_flow(): void
    {
        $user = User::factory()->create();
        $this->asAdmin()->patchJson("/api/admin/users/{$user->id}/block", ['blockReason' => 'Repeated policy violation'])->assertOk();
        $this->assertDatabaseHas('users', ['id' => $user->id, 'status' => 'Blocked', 'blockedBy' => $this->admin->id]);
        $this->asAdmin()->patchJson("/api/admin/users/{$user->id}/unblock")->assertOk();
        $this->assertDatabaseHas('users', ['id' => $user->id, 'status' => 'Active', 'blockReason' => null, 'blockedBy' => null]);

        $this->asAdmin()->deleteJson("/api/admin/users/{$user->id}")->assertOk();
        $this->asAdmin()->getJson('/api/admin/users?deleted=1')->assertOk()->assertJsonPath('data.total', 1);
        $this->asAdmin()->patchJson("/api/admin/users/{$user->id}/restore")->assertOk();
        $this->assertDatabaseHas('users', ['id' => $user->id, 'deleted_at' => null]);
    }

    public function test_invalid_block_reason_and_admin_target_are_rejected(): void
    {
        $user = User::factory()->create();
        $this->asAdmin()->patchJson("/api/admin/users/{$user->id}/block", ['blockReason' => 'bad'])->assertUnprocessable();
        $this->asAdmin()->deleteJson("/api/admin/users/{$this->admin->id}")->assertNotFound();
    }

    public function test_soft_deleted_user_appears_in_deleted_list_but_detail_endpoint_currently_hides_it(): void
    {
        $user = User::factory()->create();
        $user->delete();

        $this->asAdmin()->getJson('/api/admin/users?deleted=1')->assertOk()
            ->assertJsonPath('data.data.0.id', $user->id);
        $this->asAdmin()->getJson("/api/admin/users/{$user->id}")->assertNotFound();
    }
}
