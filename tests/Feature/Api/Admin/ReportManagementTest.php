<?php

namespace Tests\Feature\Api\Admin;

use App\Models\Report;
use App\Models\User;

class ReportManagementTest extends AdminApiTestCase
{
    public function test_reports_support_search_status_target_type_and_pagination(): void
    {
        $reporter = User::factory()->create(['name' => 'Reporter Match']);
        Report::factory()->create(['reporterId' => $reporter->id, 'targetType' => 'user', 'status' => 'Open']);
        Report::factory()->create(['status' => 'Resolved', 'targetType' => 'event']);

        $this->asAdmin()->getJson('/api/admin/reports?search=Reporter&status=Open&target_type=user&per_page=10')
            ->assertOk()->assertJsonPath('data.total', 1);
        $this->asAdmin()->getJson('/api/admin/reports?target_type=invalid')->assertUnprocessable();
        $this->asAdmin()->getJson('/api/admin/reports?per_page=11')->assertUnprocessable();
    }

    public function test_report_details_resolve_soft_deleted_target_and_status_update_is_validated(): void
    {
        $target = User::factory()->create(['name' => 'Deleted Target']);
        $target->delete();
        $report = Report::factory()->create(['targetType' => 'user', 'targetId' => $target->id]);

        $this->asAdmin()->getJson("/api/admin/reports/{$report->id}")->assertOk()
            ->assertJsonPath('data.target_details.name', 'Deleted Target');
        $this->asAdmin()->patchJson("/api/admin/reports/{$report->id}/status", ['status' => 'invalid'])->assertUnprocessable();
        $this->asAdmin()->patchJson("/api/admin/reports/{$report->id}/status", ['status' => 'Resolved'])->assertOk();
        $this->assertDatabaseHas('reports', ['id' => $report->id, 'status' => 'Resolved']);
    }
}
