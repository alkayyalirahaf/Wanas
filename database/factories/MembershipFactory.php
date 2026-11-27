<?php

namespace Database\Factories;

use App\Models\Group;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class MembershipFactory extends Factory
{

    public function definition(): array
    {
        return [
            'userId' => User::factory()->member(),
            'groupId' => Group::factory()->privateGroup(),
            'status' => 'Pending',
            'requestMessage' => 'أرغب بالانضمام ومشاركة تجربتي باحترام وخصوصية.',
            'joinedAt' => null,
        ];
    }

    public function active(): static
    {
        return $this->state(fn() => [
            'status' => 'Active',
            'requestMessage' => null,
            'joinedAt' => now()->subDays(fake()->numberBetween(1, 90)),
        ]);
    }

    public function rejected(): static
    {
        return $this->state(fn() => [
            'status' => 'Rejected',
            'requestMessage' => 'أرغب بالانضمام إلى مساحة الدعم.',
            'joinedAt' => null,
        ]);
    }


    public function directPublicJoin(): static
    {
        return $this->state(fn() => [
            'groupId' => Group::factory()->state(['isPrivate' => false, 'status' => 'Active']),
            'status' => 'Active',
            'requestMessage' => null,
            'joinedAt' => now()->subDays(fake()->numberBetween(1, 90)),
        ]);
    }
}
