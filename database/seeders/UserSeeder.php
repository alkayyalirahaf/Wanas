<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use LogicException;

class UserSeeder extends Seeder
{
    public const SPECIALISTS = [
        'specialist.pending@demo.wanas.test',
        'specialist.active@demo.wanas.test',
        'specialist.rejected@demo.wanas.test',
    ];

    public const FACILITATORS = [
        'facilitator.one@demo.wanas.test',
        'facilitator.two@demo.wanas.test',
        'facilitator.three@demo.wanas.test',
    ];

    public const MEMBERS = [
        'member.one@demo.wanas.test',
        'member.two@demo.wanas.test',
        'member.three@demo.wanas.test',
        'member.four@demo.wanas.test',
        'member.five@demo.wanas.test',
        'member.pending@demo.wanas.test',
        'member.blocked@demo.wanas.test',
        'member.rejected@demo.wanas.test',
    ];

    public function run(): void
    {
        $password = Hash::make((string) env('WANAS_DEMO_PASSWORD', 'WanasDemo#2026'));

        foreach ([
            [self::SPECIALISTS[0], 'د. سارة الخطيب', 'specialist', 'Pending'],
            [self::SPECIALISTS[1], 'د. ليان حداد', 'specialist', 'Active'],
            [self::SPECIALISTS[2], 'د. عمر النابلسي', 'specialist', 'Rejected'],
            [self::FACILITATORS[0], 'ميساء العلي', 'facilitator', 'Active'],
            [self::FACILITATORS[1], 'نور الزعبي', 'facilitator', 'Active'],
            [self::FACILITATORS[2], 'رنا منصور', 'facilitator', 'Active'],
            [self::MEMBERS[0], 'آدم حمدان', 'member', 'Active'],
            [self::MEMBERS[1], 'جنى عيسى', 'member', 'Active'],
            [self::MEMBERS[2], 'كريم شرف', 'member', 'Active'],
            [self::MEMBERS[3], 'تالا يوسف', 'member', 'Active'],
            [self::MEMBERS[4], 'رامي ناصر', 'member', 'Active'],
            [self::MEMBERS[5], 'لمى سعيد', 'member', 'Pending'],
            [self::MEMBERS[6], 'يزن فهد', 'member', 'Blocked'],
            [self::MEMBERS[7], 'هبة مراد', 'member', 'Rejected'],
        ] as [$email, $name, $role, $status]) {
            $this->fixtureUser([
                'name' => $name,
                'email' => $email,
                'phoneNumber' => fake()->unique()->numerify('+96279#######'),
                'password' => $password,
                'role' => $role,
                'status' => $status,
                'email_verified_at' => now(),
                'bio' => match ($role) {
                    'specialist' => 'يقدم دعمًا مهنيًا ضمن نطاق خبرته، ويكمل دعم الأقران ولا يحل محل الرعاية الطبية.',
                    'facilitator' => 'أهتم بتيسير مساحة آمنة للحوار وتبادل الخبرات بين أعضاء المجتمع.',
                    default => 'أبحث عن مساحة دعم آمنة لتبادل الخبرات مع أشخاص يمرون بتجربة مشابهة.',
                },
            ]);
        }
    }

    private function fixtureUser(array $attributes): User
    {
        $user = User::withTrashed()->where('email', $attributes['email'])->first();

        if ($user && ($user->role !== $attributes['role'] || $user->status !== $attributes['status'])) {
            throw new LogicException("Demo email [{$attributes['email']}] already exists with a different role or status.");
        }

        if (! $user) {
            $user = User::create($attributes);
        }

        // This email is an explicit fixture; unrelated soft-deleted users are never restored.
        if ($user->trashed()) {
            $user->restore();
        }

        return $user;
    }
}
