<?php

namespace Database\Factories;

use App\Models\Booking;
use Illuminate\Database\Eloquent\Factories\Factory;

class ReviewFactory extends Factory
{
    public function definition(): array
    {
        return [
            'bookingId' => Booking::factory()->completed(),
            'rating' => fake()->numberBetween(4, 5),
            'comment' => fake()->randomElement([
                'شعرت بالإنصات والاحترام، وكانت الجلسة مفيدة.',
                'ساعدتني الجلسة على فهم خيارات الدعم المتاحة لي.',
                'كانت مساحة مهنية ومريحة لمشاركة تجربتي.',
            ]),
        ];
    }
}
