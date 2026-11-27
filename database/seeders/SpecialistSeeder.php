<?php

namespace Database\Seeders;

use App\Models\Specialist;
use App\Models\SpecialistSlot;
use App\Models\User;
use App\Models\VerificationDocument;
use Illuminate\Database\Seeder;

class SpecialistSeeder extends Seeder
{
    public function run(): void
    {
        $profiles = [
            [UserSeeder::SPECIALISTS[0], 'الإرشاد النفسي الداعم', 'pending', 'pending'],
            [UserSeeder::SPECIALISTS[1], 'العلاج الأسري', 'active', 'approved'],
            [UserSeeder::SPECIALISTS[2], 'دعم الصدمات والتعافي', 'rejected', 'rejected'],
        ];

        foreach ($profiles as [$email, $specialty, $profileStatus, $documentStatus]) {
            $user = User::query()->where('email', $email)->where('role', 'specialist')->firstOrFail();
            $specialist = Specialist::firstOrCreate(
                ['userId' => $user->id],
                [
                    'specialty' => $specialty,
                    'bio' => 'يقدم دعمًا مهنيًا متوافقًا مع خبرته، ويكمل مجموعات دعم الأقران ولا يحل محل الرعاية الطبية.',
                    'price' => 65.00,
                    'status' => $profileStatus,
                ],
            );
            if ($specialist->status !== $profileStatus) {
                throw new \LogicException("Demo specialist profile for [{$email}] has an unexpected approval status.");
            }

            foreach (['license', 'id_card'] as $documentType) {
                $document = VerificationDocument::firstOrCreate(
                    ['userId' => $user->id, 'documentType' => $documentType],
                    [
                        'fileUrl' => "verification/demo/{$user->id}-{$documentType}.pdf",
                        'status' => $documentStatus,
                    ],
                );
                if ($document->status !== $documentStatus) {
                    throw new \LogicException("Demo verification document for [{$email}] has an unexpected review status.");
                }
            }

            if ($profileStatus === 'active') {
                $this->activeSpecialistSlots($specialist);
            }
        }
    }

    private function activeSpecialistSlots(Specialist $specialist): void
    {
        // Index order is consumed by BookingSeeder: refunded, completed, failed,
        // confirmed, then a second canceled booking. Dates track each final state.
        $slots = [
            [1, 13, false],
            [-12, 11, true],
            [2, 10, false],
            [4, 12, true],
            [6, 14, false],
            [8, 15, false],
        ];

        foreach ($slots as [$dayOffset, $hour, $isBooked]) {
            $start = now()->startOfDay()->addDays($dayOffset)->setTime($hour, 0);
            // The demo specialist is a stable fixture identity. Match its fixture
            // slots by their distinct hour so daily reseeds update, rather than duplicate, rows.
            $matchingSlots = SpecialistSlot::query()
                ->where('specialistId', $specialist->id)
                ->whereTime('startTime', sprintf('%02d:00:00', $hour))
                ->get();
            if ($matchingSlots->count() > 1) {
                throw new \LogicException("Multiple fixture slots match {$hour}:00 for specialist [{$specialist->id}].");
            }
            $slot = $matchingSlots->first() ?? new SpecialistSlot(['specialistId' => $specialist->id]);
            $slot->specialistId = $specialist->id;
            $slot->endTime = $start->copy()->addHour();
            $slot->startTime = $start;
            $slot->isBooked = $isBooked;
            $slot->save();
        }
    }
}
