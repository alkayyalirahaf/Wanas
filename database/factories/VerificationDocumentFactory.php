<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class VerificationDocumentFactory extends Factory
{
    public function definition(): array
    {
        return [
            'userId' => User::factory()->specialistRole(),
            'documentType' => fake()->randomElement(['license', 'id_card']),
            'fileUrl' => 'verification/demo/'.Str::uuid().'.pdf',
            'status' => 'pending',
        ];
    }

    public function approved(): static
    {
        return $this->state(fn () => ['status' => 'approved']);
    }

    public function rejected(): static
    {
        return $this->state(fn () => ['status' => 'rejected']);
    }
}
