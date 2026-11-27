<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\EventAttendee;
use App\Models\Membership;
use App\Models\User;
use Illuminate\Database\Seeder;

class EventAttendeeSeeder extends Seeder
{
    public function run(): void
    {
        $fixtures = [
            [EventSeeder::TITLES['survivors'], [0, 1, 2, 3]],
            [EventSeeder::TITLES['fertility'], [1, 2, 3]],
            [EventSeeder::TITLES['standalone'], [0, 2]],
        ];

        foreach ($fixtures as [$title, $memberIndexes]) {
            $event = Event::query()->where('title', $title)->where('status', 'Published')->firstOrFail();
            if (
                $event->startsAt->isPast() ||
                $event->capacity <= 0 ||
                $event->attendees()->count() >= $event->capacity
            ) {
                throw new \LogicException("Demo event [{$title}] is not available for attendee fixtures.");
            }
            if ($event->groupId !== null) {
                $group = $event->group()->firstOrFail();
                if ($group->status !== 'Active') {
                    throw new \LogicException('Members cannot attend events for archived groups.');
                }
            }

            foreach ($memberIndexes as $index) {
                $member = User::query()->where('email', UserSeeder::MEMBERS[$index])->where('role', 'member')->where('status', 'Active')->firstOrFail();
                if ($event->groupId !== null && $group->isPrivate) {
                    $isActiveMember = Membership::query()->where('userId', $member->id)->where('groupId', $group->id)->where('status', 'Active')->exists();
                    if (!$isActiveMember) {
                        continue;
                    }
                }

                if (EventAttendee::query()->where('eventId', $event->id)->where('userId', $member->id)->exists()) {
                    continue;
                }
                if ($event->attendees()->count() >= $event->capacity) {
                    throw new \LogicException("Demo event [{$title}] exceeded its attendee capacity.");
                }

                EventAttendee::create([
                    'eventId' => $event->id,
                    'userId' => $member->id,
                    'joinedAt' => now()->subDays(1),
                ]);
            }
        }
    }
}
