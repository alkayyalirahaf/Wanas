<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\Group;
use App\Models\Specialist;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class EventFactory extends Factory
{
    public function configure(): static
    {
        return $this->afterMaking(function (Event $event): void {
            if ($event->groupId !== null) {
                $group = Group::query()->findOrFail($event->groupId);

                if ($event->hostId !== $group->ownerId) {
                    throw new \LogicException('The event host must own the group.');
                }

                if ($event->status === 'Published' && $group->status !== 'Active') {
                    throw new \LogicException('Published events cannot be linked to archived groups.');
                }
            }

        })->afterCreating(function (Event $event): void {
            if ($event->groupId === null) {
                $host = User::query()->findOrFail($event->hostId);
                if ($host->role !== 'specialist' || $host->status !== 'Active') {
                    throw new \LogicException('Standalone events must be hosted by an active specialist account.');
                }
                $profile = Specialist::firstOrCreate(
                    ['userId' => $host->id],
                    ['specialty' => 'الدعم النفسي', 'bio' => 'مختص يقدم دعمًا مهنيًا مكملًا لدعم الأقران.', 'price' => 65, 'status' => 'active'],
                );
                if ($profile->status !== 'active') {
                    throw new \LogicException('Standalone event hosts must have an active Specialist profile.');
                }
            }
        });
    }

    public function definition(): array
    {
        $start = now()->addDays(fake()->numberBetween(1, 45))->setTime(fake()->numberBetween(9, 18), 0);

        return [
            'groupId' => Group::factory(),
            'hostId' => fn(array $attributes) => Group::query()->findOrFail($attributes['groupId'])->ownerId,
            'title' => 'لقاء دعم بين الأقران: ' . fake()->randomElement(['التعافي بعد السرطان', 'دعم مقدمي الرعاية', 'رحلة الخصوبة', 'التعافي من الإدمان']),
            'description' => 'لقاء لتبادل الخبرات والدعم بين الأقران، ولا يحل محل الرعاية الطبية أو النفسية المتخصصة.',
            'locationType' => fake()->randomElement(['online', 'indoor', 'outdoor']),
            'locationDetails' => fake()->randomElement(['عبر منصة Wanas', 'مركز مجتمعي في عمّان', 'جبل عمّان']),
            'capacity' => fake()->numberBetween(8, 30),
            'startsAt' => $start,
            'endsAt' => $start->copy()->addHours(2),
            'coverImageUrl' => null,
            'status' => 'Published',
        ];
    }

    public function standalone(): static
    {
        return $this->state(fn() => [
            'groupId' => null,
            'hostId' => User::factory()->specialistRole(),
        ]);
    }

    public function draft(): static
    {
        return $this->state(fn() => ['status' => 'Draft']);
    }

    public function canceled(): static
    {
        return $this->state(fn() => ['status' => 'Canceled']);
    }
}
