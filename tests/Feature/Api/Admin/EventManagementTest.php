<?php

namespace Tests\Feature\Api\Admin;

use App\Models\Event;

class EventManagementTest extends AdminApiTestCase
{
    public function test_events_support_search_status_location_pagination_and_validation(): void
    {
        Event::factory()->create(['title' => 'Search Event', 'status' => 'Published', 'locationType' => 'online']);
        Event::factory()->canceled()->create();
        $this->asAdmin()->getJson('/api/admin/events?search=Search&status=Published&locationType=online&per_page=10')
            ->assertOk()->assertJsonPath('data.total', 1);
        $this->asAdmin()->getJson('/api/admin/events?status=invalid')->assertUnprocessable();
    }

    public function test_event_details_soft_delete_listing_and_restore_flow(): void
    {
        $event = Event::factory()->create();
        $this->asAdmin()->deleteJson("/api/admin/events/{$event->id}", ['deletionReason' => 'Policy violation'])->assertOk();
        $this->asAdmin()->getJson('/api/admin/events?deleted=1')->assertOk()->assertJsonPath('data.total', 1);
        $this->asAdmin()->getJson("/api/admin/events/{$event->id}")->assertOk();
        $this->asAdmin()->patchJson("/api/admin/events/{$event->id}/restore")->assertOk();
        $this->assertDatabaseHas('events', ['id' => $event->id, 'deleted_at' => null]);
    }

    public function test_deletion_reason_and_filters_are_validated(): void
    {
        $event = Event::factory()->create();
        $this->asAdmin()->deleteJson("/api/admin/events/{$event->id}", ['deletionReason' => 'bad'])->assertUnprocessable();
        $this->asAdmin()->getJson('/api/admin/events?locationType=invalid')->assertUnprocessable();
    }
}
