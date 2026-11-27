<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class SpecialistFactory extends Factory
{
    public function definition(): array
    {
        return [
            'userId' => User::factory()->specialistRole(),
            'specialty' => fake()->randomElement(['الدعم النفسي', 'العلاج الأسري', 'دعم الصدمات والتعافي', 'الإرشاد النفسي']),
            'bio' => 'مختص يقدم رعاية مهنية ضمن نطاق خبرته، إلى جانب دعم الأقران وليس بديلاً عنه.',
            'price' => fake()->randomFloat(2, 25, 150),
            'status' => 'active',
        ];
    }

    public function active(): static
    {
        return $this->state(fn () => ['status' => 'active']);
    }

    public function pending(): static
    {
        return $this->state(fn () => [
            'status' => 'pending',
            'userId' => User::factory()->specialistRole('Pending'),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn () => [
            'status' => 'rejected',
            'userId' => User::factory()->specialistRole('Rejected'),
        ]);
    }
}
