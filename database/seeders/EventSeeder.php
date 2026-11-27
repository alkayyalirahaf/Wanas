<?php

namespace Database\Seeders;

use App\Models\Event;
use App\Models\Group;
use App\Models\Specialist;
use App\Models\User;
use Illuminate\Database\Seeder;

class EventSeeder extends Seeder
{
    public const TITLES = [
        'survivors' => 'لقاء تبادل الخبرات بعد علاج السرطان',
        'caregivers' => 'جلسة دعم لأهالي مرضى السرطان',
        'fertility' => 'لقاء رفقاء رحلة أطفال الأنابيب',
        'canceled' => 'جلسة مجتمع التعافي: لقاء مؤجل',
        'standalone' => 'ندوة الأخصائي حول الاستعداد للدعم المهني',
    ];

    public function run(): void
    {
        $definitions = [
            ['key' => 'survivors', 'group' => 'survivors', 'host' => UserSeeder::FACILITATORS[0], 'status' => 'Published', 'days' => 5, 'locationType' => 'online'],
            ['key' => 'caregivers', 'group' => 'caregivers', 'host' => UserSeeder::FACILITATORS[1], 'status' => 'Draft', 'days' => 9, 'locationType' => 'indoor'],
            ['key' => 'fertility', 'group' => 'fertility', 'host' => UserSeeder::FACILITATORS[2], 'status' => 'Published', 'days' => 12, 'locationType' => 'online'],
            ['key' => 'canceled', 'group' => 'recovery', 'host' => UserSeeder::FACILITATORS[0], 'status' => 'Canceled', 'days' => -3, 'locationType' => 'indoor'],
        ];

        foreach ($definitions as $definition) {
            $host = User::query()
                ->where('email', $definition['host'])
                ->where('role', 'facilitator')
                ->where('status', 'Active')
                ->firstOrFail();

            $group = Group::query()
                ->where('title', GroupSeeder::GROUPS[$definition['group']])
                ->firstOrFail();

            if ($group->ownerId !== $host->id) {
                throw new \LogicException('The event host must own the group.');
            }

            if ($group->status === 'Archived' && $definition['status'] === 'Published') {
                throw new \LogicException('Archived groups cannot have publicly available demo events.');
            }

            $start = now()->addDays($definition['days'])->setTime(17, 0);
            $this->saveFixture([
                'hostId' => $host->id,
                'title' => self::TITLES[$definition['key']],
                'groupId' => $group->id,
                'description' => $this->description($definition['key']),
                'locationType' => $definition['locationType'],
                'locationDetails' => $definition['locationType'] === 'online' ? 'عبر منصة Wanas' : 'مركز مجتمعي في عمّان',
                'capacity' => 20,
                'startsAt' => $start,
                'endsAt' => $start->copy()->addHours(2),
                'coverImageUrl' => null,
                'status' => $definition['status'],
            ]);
        }

        $specialistEmail = UserSeeder::SPECIALISTS[1];
        $specialistUser = User::query()->where('email', $specialistEmail)->where('role', 'specialist')->where('status', 'Active')->firstOrFail();
        Specialist::query()->where('userId', $specialistUser->id)->where('status', 'active')->firstOrFail();
        $start = now()->addDays(15)->setTime(16, 0);
        $this->saveFixture([
            'hostId' => $specialistUser->id,
            'title' => self::TITLES['standalone'],
            'groupId' => null,
            'description' => 'لقاء تعريفي بموارد الدعم المهني وكيفية الوصول إلى المختص المناسب.',
            'locationType' => 'online',
            'locationDetails' => 'عبر منصة Wanas',
            'capacity' => 15,
            'startsAt' => $start,
            'endsAt' => $start->copy()->addHours(2),
            'coverImageUrl' => null,
            'status' => 'Published',
        ]);
    }

    private function saveFixture(array $attributes): Event
    {
        $event = Event::withTrashed()->where('hostId', $attributes['hostId'])->where('title', $attributes['title'])->first();
        if (!$event) {
            return Event::create($attributes);
        }

        // Keep future event dates stable; refresh dates for elapsed non-canceled events.
        if ($event->startsAt && $event->startsAt->isFuture()) {
            $attributes['startsAt'] = $event->startsAt;
            $attributes['endsAt'] = $event->endsAt;
        } elseif ($attributes['status'] === 'Canceled') {
            $attributes['startsAt'] = $event->startsAt;
            $attributes['endsAt'] = $event->endsAt;
        }

        $event->update($attributes);
        if ($event->trashed()) {
            $event->restore();
        }

        return $event;
    }

    private function description(string $key): string
    {
        return match ($key) {
            'survivors' => 'لقاء بين الأقران لتبادل الخبرات بعد العلاج، ولا يُعد بديلاً عن المتابعة الطبية.',
            'caregivers' => 'مساحة مشاركة لأفراد العائلة ومقدمي الرعاية حول تجاربهم واحتياجاتهم.',
            'fertility' => 'لقاء داعم للأشخاص الذين يمرون بتحديات الخصوبة أو علاج أطفال الأنابيب.',
            default => 'لقاء مجتمعي مؤجل لمجموعة التعافي؛ لا يستقبل تسجيلات جديدة.',
        };
    }
}
