<?php

namespace Database\Factories;

use App\Models\Specialist;
use Illuminate\Database\Eloquent\Factories\Factory;

class SpecialistSlotFactory extends Factory
{
    public function definition(): array
    {
        $start = now()->addDays(fake()->numberBetween(1, 30))->setTime(fake()->numberBetween(9, 16), 0);

        return [
            'specialistId' => Specialist::factory()->active(),
            'startTime' => $start,
            'endTime' => $start->copy()->addHour(),
            'isBooked' => false,
        ];
    }

    public function booked(): static
    {
        return $this->state(fn () => ['isBooked' => true]);
    }

    public function past(): static
    {
        return $this->state(function () {
            $start = now()->subDays(fake()->numberBetween(2, 60))->setTime(10, 0);

            return ['startTime' => $start, 'endTime' => $start->copy()->addHour()];
        });
    }

    public function available(): static
    {
        return $this->state(fn () => ['isBooked' => false]);
    }
}