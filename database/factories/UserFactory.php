<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserFactory extends Factory
{
    protected static ?string $password = null;

    public function definition(): array
    {
        return [
            'name' => fake()->randomElement(['آدم حمدان', 'جنى عيسى', 'كريم شرف', 'تالا يوسف', 'رامي ناصر', 'لمى سعيد', 'يزن فهد', 'هبة مراد']),
            'email' => fake()->unique()->safeEmail(),
            'phoneNumber' => fake()->optional()->numerify('+9627########'),
            'email_verified_at' => now(),
            'password' => static::$password ??= Hash::make('password'),
            'remember_token' => Str::random(60),
            'role' => 'member',
            'status' => 'Active',
            'bio' => fake()->optional()->randomElement([
                'أبحث عن مساحة دعم آمنة لتبادل الخبرات مع أشخاص يمرون بتجربة مشابهة.',
                'أؤمن بأهمية الدعم بين الأقران إلى جانب الرعاية المهنية المتخصصة.',
            ]),
        ];
    }

    public function specialistRole(string $userStatus = 'Active'): static
    {
        return $this->state(fn () => ['role' => 'specialist', 'status' => $userStatus]);
    }

    public function facilitatorRole(string $userStatus = 'Active'): static
    {
        return $this->state(fn () => ['role' => 'facilitator', 'status' => $userStatus]);
    }

    public function member(): static
    {
        return $this->state(fn () => ['role' => 'member']);
    }

    public function withUserStatus(string $status): static
    {
        return $this->state(fn () => ['status' => $status]);
    }
}
