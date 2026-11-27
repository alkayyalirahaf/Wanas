<?php

namespace Database\Seeders;

use App\Models\Group;
use App\Models\User;
use Illuminate\Database\Seeder;

class GroupSeeder extends Seeder
{
    public const GROUPS = [
        'survivors' => 'دائرة الناجين من السرطان',
        'caregivers' => 'مساحة أهالي ومقدمي رعاية مرضى السرطان',
        'fertility' => 'رفقاء رحلة الخصوبة وأطفال الأنابيب',
        'recovery' => 'مجتمع التعافي من الإدمان',
    ];

    public function run(): void
    {
        $definitions = [
            ['key' => 'survivors', 'owner' => UserSeeder::FACILITATORS[0], 'topic' => 'cancer-survivors', 'private' => false, 'status' => 'Active'],
            ['key' => 'caregivers', 'owner' => UserSeeder::FACILITATORS[1], 'topic' => 'cancer-caregivers', 'private' => true, 'status' => 'Active'],
            ['key' => 'fertility', 'owner' => UserSeeder::FACILITATORS[2], 'topic' => 'fertility-ivf', 'private' => false, 'status' => 'Active'],
            ['key' => 'recovery', 'owner' => UserSeeder::FACILITATORS[0], 'topic' => 'addiction-recovery', 'private' => true, 'status' => 'Archived'],
        ];

        foreach ($definitions as $definition) {
            $owner = User::query()->where('email', $definition['owner'])->where('role', 'facilitator')->where('status', 'Active')->firstOrFail();
            $title = self::GROUPS[$definition['key']];
            $group = Group::withTrashed()->where('ownerId', $owner->id)->where('title', $title)->first();

            if (! $group) {
                $group = Group::create([
                    'ownerId' => $owner->id,
                    'title' => $title,
                    'topic' => $definition['topic'],
                    'description' => $this->description($definition['key']),
                    'coverImageUrl' => null,
                    'isPrivate' => $definition['private'],
                    'status' => $definition['status'],
                ]);
            } else {
                // Update only this seeder's uniquely identified demo group.
                $group->update([
                    'topic' => $definition['topic'],
                    'description' => $this->description($definition['key']),
                    'isPrivate' => $definition['private'],
                    'status' => $definition['status'],
                ]);
                if ($group->trashed()) {
                    $group->restore();
                }
            }
        }
    }

    private function description(string $key): string
    {
        return match ($key) {
            'survivors' => 'مساحة آمنة للناجين من السرطان لتبادل الخبرات اليومية والتشجيع المتبادل، مع احترام دور الرعاية الطبية المتخصصة.',
            'caregivers' => 'مساحة لأفراد العائلة ومقدمي الرعاية لمشاركة تجارب الدعم والاهتمام بأحبائهم دون أن تحل محل الإرشاد المهني.',
            'fertility' => 'مجتمع للأشخاص الذين يمرون بتحديات الخصوبة أو علاج أطفال الأنابيب لتبادل الخبرات باحترام وخصوصية.',
            default => 'مجتمع للأشخاص في رحلة التعافي من الإدمان لتبادل الخبرات والتشجيع بين الأقران إلى جانب الرعاية المتخصصة.',
        };
    }
}
