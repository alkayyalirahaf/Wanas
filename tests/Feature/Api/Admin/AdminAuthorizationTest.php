<?php

namespace Tests\Feature\Api\Admin;

use App\Models\User;

class AdminAuthorizationTest extends AdminApiTestCase
{
    public function test_unauthenticated_users_cannot_access_admin_api(): void
    {
        $requests = [
            ['GET', '/api/admin/me'], ['POST', '/api/admin/logout'], ['GET', '/api/admin/stats'],
            ['GET', '/api/admin/specialist-verifications'], ['GET', '/api/admin/verification-documents/1'],
            ['PATCH', '/api/admin/specialist-verifications/1/approve'], ['PATCH', '/api/admin/specialist-verifications/1/reject'],
            ['GET', '/api/admin/facilitator-applications'], ['PATCH', '/api/admin/facilitator-applications/1/approve'],
            ['PATCH', '/api/admin/facilitator-applications/1/reject'], ['GET', '/api/admin/reports'], ['GET', '/api/admin/reports/1'],
            ['PATCH', '/api/admin/reports/1/status'], ['GET', '/api/admin/users'], ['GET', '/api/admin/users/1'],
            ['PATCH', '/api/admin/users/1/block'], ['PATCH', '/api/admin/users/1/unblock'], ['DELETE', '/api/admin/users/1'],
            ['PATCH', '/api/admin/users/1/restore'], ['GET', '/api/admin/groups'], ['GET', '/api/admin/groups/1'],
            ['PATCH', '/api/admin/groups/1/archive'], ['PATCH', '/api/admin/groups/1/activate'], ['DELETE', '/api/admin/groups/1'],
            ['PATCH', '/api/admin/groups/1/restore'], ['GET', '/api/admin/events'], ['GET', '/api/admin/events/1'],
            ['DELETE', '/api/admin/events/1'], ['PATCH', '/api/admin/events/1/restore'], ['GET', '/api/admin/payments'],
            ['GET', '/api/admin/payments/1'],
        ];

        foreach ($requests as [$method, $uri]) {
            $this->json($method, $uri)->assertUnauthorized();
        }
    }

    public function test_authenticated_non_admin_users_are_forbidden_from_admin_api(): void
    {
        $member = User::factory()->create();
        foreach (['/api/admin/me', '/api/admin/stats', '/api/admin/users', '/api/admin/groups', '/api/admin/events', '/api/admin/payments'] as $uri) {
            $this->actingAs($member, 'sanctum')->getJson($uri)->assertForbidden();
        }
    }

    public function test_admin_payment_management_exposes_read_only_routes(): void
    {
        $this->asAdmin()->postJson('/api/admin/payments')->assertMethodNotAllowed();
        $this->asAdmin()->patchJson('/api/admin/payments/1')->assertMethodNotAllowed();
        $this->asAdmin()->deleteJson('/api/admin/payments/1')->assertMethodNotAllowed();
    }
}
