<?php

namespace Tests\Feature\Api\Admin;

use App\Models\Group;

class GroupManagementTest extends AdminApiTestCase
{
    public function test_groups_support_search_status_pagination_and_validation(): void
    {
        Group::factory()->create(['title' => 'Search Group', 'status' => 'Active']);
        Group::factory()->archived()->create(['title' => 'Other Group']);
        $this->asAdmin()->getJson('/api/admin/groups?search=Search&status=Active&per_page=10')->assertOk()->assertJsonPath('data.total', 1);
        $this->asAdmin()->getJson('/api/admin/groups?status=invalid')->assertUnprocessable();
    }

    public function test_archive_activate_soft_delete_and_restore_flow(): void
    {
        $group = Group::factory()->create(['status' => 'Active']);
        $this->asAdmin()->patchJson("/api/admin/groups/{$group->id}/archive")->assertOk();
        $this->assertDatabaseHas('groups', ['id' => $group->id, 'status' => 'Archived']);
        $this->asAdmin()->patchJson("/api/admin/groups/{$group->id}/activate")->assertOk();
        $this->asAdmin()->deleteJson("/api/admin/groups/{$group->id}", ['deletionReason' => 'Policy violation'])->assertOk();
        $this->asAdmin()->getJson('/api/admin/groups?deleted=1')->assertOk()->assertJsonPath('data.total', 1);
        $this->asAdmin()->getJson("/api/admin/groups/{$group->id}")->assertOk();
        $this->asAdmin()->patchJson("/api/admin/groups/{$group->id}/restore")->assertOk();
        $this->assertDatabaseHas('groups', ['id' => $group->id, 'deleted_at' => null]);
    }

    public function test_invalid_transitions_and_deletion_reason_are_rejected(): void
    {
        $group = Group::factory()->archived()->create();
        $this->asAdmin()->patchJson("/api/admin/groups/{$group->id}/archive")->assertUnprocessable();
        $this->asAdmin()->deleteJson("/api/admin/groups/{$group->id}", ['deletionReason' => 'bad'])->assertUnprocessable();
    }
}
