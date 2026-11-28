<?php

namespace Tests\Feature\Api\Admin;

use App\Models\Event;
use App\Models\FacilitatorApplication;
use App\Models\Group;
use App\Models\Report;
use App\Models\Specialist;
use App\Models\User;

class AdminDashboardTest extends AdminApiTestCase
{
    public function test_dashboard_returns_counts_and_chart_distributions(): void
    {
        User::factory()->member()->create();
        $activeUser = User::factory()->specialistRole('Active')->create();
        Specialist::factory()->create(['userId' => $activeUser->id, 'status' => 'active']);
        $pendingUser = User::factory()->specialistRole('Pending')->create();
        Specialist::factory()->create(['userId' => $pendingUser->id, 'status' => 'pending']);
        FacilitatorApplication::factory()->create();
        Report::factory()->create(['status' => 'Open']);
        Group::factory()->create();
        Event::factory()->create();

        $response = $this->asAdmin()->getJson('/api/admin/stats')->assertOk();
        $response->assertJsonPath('data.stats.total_users', 9)
            ->assertJsonPath('data.stats.active_specialists', 1)
            ->assertJsonPath('data.stats.pending_specialists', 1)
            ->assertJsonPath('data.stats.pending_facilitators', 1)
            ->assertJsonPath('data.stats.open_reports', 1)
            ->assertJsonPath('data.stats.total_groups', 2)
            ->assertJsonPath('data.stats.total_events', 1);

        $this->assertSame(2, collect($response->json('data.charts.users_by_role'))->firstWhere('role', 'specialist')['count']);
        $this->assertSame(1, collect($response->json('data.charts.events_by_status'))->firstWhere('status', 'Published')['count']);
    }

    public function test_soft_deleted_users_groups_and_events_are_excluded_by_default_counts(): void
    {
        $user = User::factory()->create();
        $group = Group::factory()->create();
        $event = Event::factory()->create();
        $user->delete(); $group->delete(); $event->delete();

        $response = $this->asAdmin()->getJson('/api/admin/stats')->assertOk();
        $response->assertJsonPath('data.stats.total_users', 3)
            ->assertJsonPath('data.stats.total_groups', 1)
            ->assertJsonPath('data.stats.total_events', 0);
    }
}
