<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\EventAttendee;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EventAttendeeFactory extends Factory
{
    public function configure(): static
    {
        return $this->afterMaking(function (EventAttendee $attendee): void {
            $event = $attendee->event()->firstOrFail();
            if ($event->status !== 'Published' || $event->startsAt->isPast()) {
                throw new \LogicException('Attendees can only be created for future published events.');
            }
            if ($event->groupId !== null) {
                $group = $event->group()->firstOrFail();
                if ($group->status !== 'Active') {
                    throw new \LogicException('Attendees cannot be added to events linked to archived groups.');
                }
                if ($group->isPrivate && ! $group->memberships()->where('userId', $attendee->userId)->where('status', 'Active')->exists()) {
                    throw new \LogicException('Private-group event attendees must be active group members.');
                }
            }
            if ($event->attendees()->count() >= $event->capacity) {
                throw new \LogicException('The event attendee factory exceeded event capacity.');
            }
        });
    }

    public function definition(): array
    {
        return [
            'eventId' => Event::factory()->state(['status' => 'Published']),
            'userId' => User::factory()->member(),
            'joinedAt' => now(),
        ];
    }
}
