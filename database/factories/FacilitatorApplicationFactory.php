<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class FacilitatorApplicationFactory extends Factory
{
    public function definition(): array
    {
        return [
            'userId' => User::factory()->member(),
            'reviewedBy' => null,
            'proposedTopic' => fake()->randomElement([
                'تيسير مجموعة دعم الناجين من السرطان',
                'تيسير مساحة دعم مقدمي الرعاية',
                'تيسير مجتمع رحلة الخصوبة',
            ]),
            'reason' => 'أرغب في تيسير مساحة آمنة تحترم تجارب الأعضاء وتشجع الدعم المتبادل بين الأقران.',
            'status' => 'Pending',
        ];
    }

    public function rejectedBy(int $adminId): static
    {
        if (User::query()->whereKey($adminId)->where('role', 'admin')->where('status', 'Active')->doesntExist()) {
            throw new \InvalidArgumentException('reviewedBy must reference an existing active Admin account.');
        }

        return $this->state(fn () => [
            'reviewedBy' => $adminId,
            'status' => 'Rejected',
        ]);
    }

    public function approvedFor(User $activeFacilitator, int $adminId): static
    {
        if ($activeFacilitator->role !== 'facilitator' || $activeFacilitator->status !== 'Active') {
            throw new \InvalidArgumentException('Approved applications must reflect an already-active Facilitator account.');
        }
        if (User::query()->whereKey($adminId)->where('role', 'admin')->where('status', 'Active')->doesntExist()) {
            throw new \InvalidArgumentException('reviewedBy must reference an existing active Admin account.');
        }

        return $this->state(fn () => [
            'userId' => $activeFacilitator->id,
            'reviewedBy' => $adminId,
            'status' => 'Approved',
        ]);
    }
}
