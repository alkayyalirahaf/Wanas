<?php

namespace Database\Seeders;

use App\Models\Group;
use App\Models\Membership;
use App\Models\User;
use Illuminate\Database\Seeder;

class MembershipSeeder extends Seeder
{
    public function run(): void
    {
        $definitions = [
            [UserSeeder::MEMBERS[0], 'survivors', 'Active'], // direct join to public group
            [UserSeeder::MEMBERS[1], 'survivors', 'Active'],
            [UserSeeder::MEMBERS[2], 'caregivers', 'Pending'],
            [UserSeeder::MEMBERS[3], 'caregivers', 'Active'],
            [UserSeeder::MEMBERS[4], 'caregivers', 'Rejected'],
            [UserSeeder::MEMBERS[0], 'fertility', 'Active'], // direct join to public group
            [UserSeeder::MEMBERS[1], 'fertility', 'Active'],
        ];

        foreach ($definitions as [$email, $groupKey, $status]) {
            $member = User::query()->where('email', $email)->where('role', 'member')->where('status', 'Active')->firstOrFail();
            $group = Group::query()->where('title', GroupSeeder::GROUPS[$groupKey])->firstOrFail();
            if ($group->status !== 'Active') {
                throw new \LogicException('New demo memberships can only target active groups.');
            }
            if (!$group->isPrivate && $status !== 'Active') {
                throw new \LogicException('Public group fixtures may only represent direct active joins.');
            }

            $membership = Membership::query()->where('userId', $member->id)->where('groupId', $group->id)->first();
            if ($membership && $membership->status !== $status) {
                throw new \LogicException("Existing demo membership for [{$email}] in [{$group->title}] has a different status.");
            }
            if (!$membership) {
                Membership::create([
                    'userId' => $member->id,
                    'groupId' => $group->id,
                    'status' => $status,
                    'requestMessage' => $group->isPrivate && in_array($status, ['Pending', 'Rejected'], true)
                        ? 'أرغب بالانضمام ومشاركة تجربتي مع احترام خصوصية أعضاء المجموعة.'
                        : null,
                    'joinedAt' => $status === 'Active'
                        ? now()->subDays(10)
                        : null,
                ]);
            }
        }
    }
}
