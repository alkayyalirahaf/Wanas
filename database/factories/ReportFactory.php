<?php

namespace Database\Factories;

use App\Models\Event;
use App\Models\Group;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReportFactory extends Factory
{
    public function definition(): array
    {
        return [
            'reporterId' => User::factory()->member(),
            'targetType' => 'user',
            'targetId' => User::factory()->member(),
            'category' => fake()->randomElement(['safety', 'conduct', 'content']),
            'description' => fake()->randomElement([
                'أرجو مراجعة هذا المحتوى للتأكد من احترام خصوصية أعضاء المجتمع.',
                'أبلغ عن سلوك يحتاج إلى مراجعة لضمان مساحة آمنة وداعمة.',
                'قد يتضمن هذا المحتوى معلومات غير مناسبة لمجتمع الدعم.',
            ]),
            'status' => fake()->randomElement(['Open', 'Resolved', 'Dismissed']),
        ];
    }

    public function forEvent(): static
    {
        return $this->state(fn () => ['targetType' => 'event', 'targetId' => Event::factory()]);
    }

    public function forGroup(): static
    {
        return $this->state(fn () => ['targetType' => 'group', 'targetId' => Group::factory()]);
    }
}
