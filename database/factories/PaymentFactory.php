<?php

namespace Database\Factories;

use App\Models\Booking;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class PaymentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'bookingId' => Booking::factory()->confirmed(),
            'stripePaymentIntentId' => 'pi_demo_'.Str::uuid(),
            'amount' => fn (array $attributes) => Booking::query()->findOrFail($attributes['bookingId'])->amount,
            'platformFee' => fn (array $attributes) => Booking::query()->findOrFail($attributes['bookingId'])->platformCommission,
            'status' => 'succeeded',
        ];
    }

    public function failed(): static
    {
        return $this->state(fn () => [
            'bookingId' => Booking::factory()->canceled(),
            'status' => 'failed',
        ]);
    }

    public function refunded(): static
    {
        return $this->state(fn () => [
            'bookingId' => Booking::factory()->refunded(),
            'status' => 'refunded',
        ]);
    }
}
