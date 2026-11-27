<?php

namespace Database\Factories;

use App\Models\Booking;
use App\Models\SpecialistSlot;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class BookingFactory extends Factory
{
    public function definition(): array
    {
        return [
            'userId' => User::factory()->member(),
            'slotId' => SpecialistSlot::factory()->available(),
            'specialistId' => fn (array $attributes) => SpecialistSlot::query()->findOrFail($attributes['slotId'])->specialistId,
            'startsAt' => fn (array $attributes) => SpecialistSlot::query()->findOrFail($attributes['slotId'])->startTime,
            'endsAt' => fn (array $attributes) => SpecialistSlot::query()->findOrFail($attributes['slotId'])->endTime,
            'amount' => fake()->randomFloat(2, 30, 180),
            'platformCommission' => fn (array $attributes) => round($attributes['amount'] * 0.15, 2),
            'providerAmount' => fn (array $attributes) => round($attributes['amount'] * 0.85, 2),
            'status' => 'Pending',
        ];
    }

    public function configure(): static
    {
        return $this->afterCreating(function (Booking $booking): void {
            $booking->slot()->update([
                'isBooked' => in_array($booking->status, ['Confirmed', 'Completed'], true),
            ]);
        });
    }

    public function completed(): static
    {
        return $this->state(fn () => [
            'slotId' => SpecialistSlot::factory()->past()->booked(),
            'status' => 'Completed',
        ]);
    }

    public function confirmed(): static
    {
        return $this->state(fn () => [
            'slotId' => SpecialistSlot::factory()->booked(),
            'status' => 'Confirmed',
        ]);
    }

    public function canceled(): static
    {
        return $this->state(fn () => [
            'slotId' => SpecialistSlot::factory()->available(),
            'status' => 'Canceled',
        ]);
    }

    public function refunded(): static
    {
        return $this->state(fn () => [
            'slotId' => SpecialistSlot::factory()->available(),
            'status' => 'Refunded',
        ]);
    }
}
