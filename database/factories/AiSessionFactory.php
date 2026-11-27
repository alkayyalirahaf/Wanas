<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AiSessionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'userId' => User::factory()->member(),
            'userInput' => [
                'message' => fake()->randomElement([
                    'أبحث عن مجموعة دعم لأشخاص يمرون بتجربة مشابهة.',
                    'أود معرفة موارد الدعم المهني والمجتمعي المتاحة.',
                    'أحتاج إلى مساحة آمنة لمشاركة تجربتي مع الأقران.',
                ]),
                'mood' => fake()->randomElement(['قلق', 'مرهق', 'هادئ']),
            ],
            'recommendations' => [
                ['type' => 'resource', 'title' => 'استكشاف موارد الدعم المتاحة'],
                ['type' => 'group', 'title' => 'التعرّف على مجموعة دعم مناسبة'],
            ],
        ];
    }
}
