<?php

namespace Tests\Feature\Api\Admin;

use App\Models\FacilitatorApplication;
use App\Models\User;

class FacilitatorApplicationTest extends AdminApiTestCase
{
    public function test_pending_applications_can_be_searched_by_applicant_and_topic(): void
    {
        $applicant = User::factory()->create(['name' => 'Target Applicant']);
        FacilitatorApplication::factory()->create(['userId' => $applicant->id, 'proposedTopic' => 'Caregiving']);
        FacilitatorApplication::factory()->create(['proposedTopic' => 'Other']);

        $this->asAdmin()->getJson('/api/admin/facilitator-applications?search=Target&topic=Caregiving&per_page=10')
            ->assertOk()->assertJsonPath('data.total', 1);
    }

    public function test_approval_promotes_applicant_and_repeated_review_is_rejected(): void
    {
        $applicant = User::factory()->create(['role' => 'member', 'status' => 'Pending']);
        $application = FacilitatorApplication::factory()->create(['userId' => $applicant->id]);

        $this->asAdmin()->patchJson("/api/admin/facilitator-applications/{$application->id}/approve")->assertOk();
        $this->assertDatabaseHas('users', ['id' => $applicant->id, 'role' => 'facilitator', 'status' => 'Active']);
        $this->assertDatabaseHas('facilitator_applications', ['id' => $application->id, 'status' => 'Approved', 'reviewedBy' => $this->admin->id]);
        $this->asAdmin()->patchJson("/api/admin/facilitator-applications/{$application->id}/reject", ['reason' => 'Repeated'])->assertUnprocessable();
    }

    public function test_blocked_applicant_remains_blocked_when_application_is_approved(): void
    {
        $applicant = User::factory()->withUserStatus('Blocked')->create();
        $application = FacilitatorApplication::factory()->create(['userId' => $applicant->id]);
        $this->asAdmin()->patchJson("/api/admin/facilitator-applications/{$application->id}/approve")->assertOk();
        $this->assertDatabaseHas('users', ['id' => $applicant->id, 'role' => 'facilitator', 'status' => 'Blocked']);
    }

    public function test_rejection_validates_reason_and_persists_reviewer_and_status(): void
    {
        $application = FacilitatorApplication::factory()->create();
        $this->asAdmin()->patchJson("/api/admin/facilitator-applications/{$application->id}/reject", ['reason' => 'bad'])->assertUnprocessable();
        $this->asAdmin()->patchJson("/api/admin/facilitator-applications/{$application->id}/reject", ['reason' => 'Incomplete information'])->assertOk();
        $this->assertDatabaseHas('facilitator_applications', ['id' => $application->id, 'status' => 'Rejected', 'reviewedBy' => $this->admin->id, 'reason' => 'Incomplete information']);
    }
}
