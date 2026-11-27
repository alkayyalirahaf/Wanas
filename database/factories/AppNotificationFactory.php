<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class AppNotificationFactory extends Factory
{
    public function definition(): array
    {
        $notification = fake()->randomElement([
            ['type' => 'membership', 'message' => 'يوجد تحديث على طلب عضويتك في مجموعة الدعم.'],
            ['type' => 'event', 'message' => 'نُشرت فعالية جديدة مرتبطة بمجتمعك.'],
            ['type' => 'booking', 'message' => 'يوجد تحديث على موعد الدعم المهني.'],
            ['type' => 'application', 'message' => 'يوجد تحديث على طلب التيسير.'],
        ]);

        return [
            'userId' => User::factory()->member(),
            'type' => $notification['type'],
            'message' => $notification['message'],
            // The schema has no target ID and the project has no member web routes yet.
            'link' => null,
            'isRead' => fake()->boolean(),
        ];
    }
}
