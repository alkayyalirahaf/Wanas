<?php

namespace Tests\Feature\Api\Admin;

use App\Models\Specialist;
use App\Models\User;
use App\Models\VerificationDocument;

class SpecialistVerificationTest extends AdminApiTestCase
{
    public function test_pending_specialists_can_be_searched_filtered_and_paginated(): void
    {
        $user = User::factory()->specialistRole('Pending')->create(['name' => 'Target Specialist']);
        Specialist::factory()->pending()->create(['userId' => $user->id, 'specialty' => 'Family Care']);
        Specialist::factory()->pending()->create(['specialty' => 'Other']);

        $this->asAdmin()->getJson('/api/admin/specialist-verifications?search=Target&specialty=Family%20Care&per_page=10')
            ->assertOk()->assertJsonPath('data.total', 1)->assertJsonPath('data.data.0.user.name', 'Target Specialist');
        $this->asAdmin()->getJson('/api/admin/specialist-verifications?per_page=51')->assertUnprocessable();
    }

    public function test_document_status_filter_is_accepted_but_currently_does_not_filter_results(): void
    {
        $pending = Specialist::factory()->pending()->create();
        $rejectedDocument = VerificationDocument::factory()->rejected()->create(['userId' => $pending->userId]);
        $approved = Specialist::factory()->pending()->create();
        VerificationDocument::factory()->approved()->create(['userId' => $approved->userId]);

        // The endpoint validates this parameter, but its query currently ignores it.
        $this->asAdmin()->getJson('/api/admin/specialist-verifications?document_status=rejected')
            ->assertOk()->assertJsonPath('data.total', 2);
        $this->assertDatabaseHas('verification_documents', ['id' => $rejectedDocument->id, 'status' => 'rejected']);
    }

    public function test_approval_activates_profile_and_account_and_approves_documents(): void
    {
        $user = User::factory()->specialistRole('Pending')->create();
        $specialist = Specialist::factory()->pending()->create(['userId' => $user->id]);
        $document = VerificationDocument::factory()->create(['userId' => $user->id]);

        $this->asAdmin()->patchJson("/api/admin/specialist-verifications/{$specialist->id}/approve")->assertOk();
        $this->assertDatabaseHas('specialists', ['id' => $specialist->id, 'status' => 'active']);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'status' => 'Active']);
        $this->assertDatabaseHas('verification_documents', ['id' => $document->id, 'status' => 'approved']);
        $this->assertDatabaseHas('notifications', ['userId' => $user->id, 'type' => 'specialist_verification']);
    }

    public function test_rejection_requires_reason_and_rejects_profile_account_and_documents(): void
    {
        $user = User::factory()->specialistRole('Pending')->create();
        $specialist = Specialist::factory()->pending()->create(['userId' => $user->id]);
        $document = VerificationDocument::factory()->create(['userId' => $user->id]);

        $this->asAdmin()->patchJson("/api/admin/specialist-verifications/{$specialist->id}/reject", ['reason' => 'no'])->assertUnprocessable();
        $this->asAdmin()->patchJson("/api/admin/specialist-verifications/{$specialist->id}/reject", ['reason' => 'Insufficient documents'])->assertOk();
        $this->assertDatabaseHas('specialists', ['id' => $specialist->id, 'status' => 'rejected']);
        $this->assertDatabaseHas('users', ['id' => $user->id, 'status' => 'Rejected']);
        $this->assertDatabaseHas('verification_documents', ['id' => $document->id, 'status' => 'rejected']);
        $this->asAdmin()->patchJson("/api/admin/specialist-verifications/{$specialist->id}/approve")->assertUnprocessable();
    }
}
