<?php

namespace Database\Seeders;

use App\Models\Booking;
use App\Models\Payment;
use App\Models\Review;
use App\Models\Specialist;
use App\Models\SpecialistSlot;
use App\Models\User;
use Illuminate\Database\Seeder;
use RuntimeException;

class BookingSeeder extends Seeder
{
    public function run(): void
    {
        $specialistUser = User::query()->where('email', UserSeeder::SPECIALISTS[1])->where('role', 'specialist')->where('status', 'Active')->firstOrFail();
        $specialist = Specialist::query()->where('userId', $specialistUser->id)->where('status', 'active')->firstOrFail();
        $slots = $this->fixtureSlots($specialist);

        $cases = [
            ['slot' => 0, 'member' => 0, 'status' => 'Refunded', 'amount' => 90.00, 'payment' => 'refunded'],
            ['slot' => 1, 'member' => 1, 'status' => 'Completed', 'amount' => 75.00, 'payment' => 'succeeded'],
            ['slot' => 2, 'member' => 2, 'status' => 'Canceled', 'amount' => 60.00, 'payment' => 'failed'],
            ['slot' => 3, 'member' => 3, 'status' => 'Confirmed', 'amount' => 80.00, 'payment' => 'succeeded'],
            ['slot' => 4, 'member' => 4, 'status' => 'Canceled', 'amount' => 55.00, 'payment' => 'failed'],
        ];

        foreach ($cases as $index => $case) {
            $slot = $slots[$case['slot']];
            $member = User::query()->where('email', UserSeeder::MEMBERS[$case['member']])->where('role', 'member')->where('status', 'Active')->firstOrFail();

            $slotBookings = Booking::query()->where('slotId', $slot->id)->get();
            if ($slotBookings->count() > 1) {
                throw new RuntimeException("Demo slot [{$slot->id}] already has multiple bookings; refusing to add another.");
            }
            $existingSlotBooking = $slotBookings->first();
            if ($existingSlotBooking && ($existingSlotBooking->userId != $member->id || $existingSlotBooking->specialistId != $specialist->id)) {
                throw new RuntimeException("Demo slot [{$slot->id}] is already linked to a different booking; refusing to alter it.");
            }

            $amount = $case['amount'];
            // Preserve the already-agreed demo commission calculation used by the prior fixture: 15%.
            $commission = round($amount * 0.15, 2);
            $booking = Booking::firstOrNew([
                'userId' => $member->id,
                'specialistId' => $specialist->id,
                'slotId' => $slot->id,
            ]);
            $booking->fill([
                'startsAt' => $slot->startTime,
                'endsAt' => $slot->endTime,
                'amount' => $amount,
                'platformCommission' => $commission,
                'providerAmount' => round($amount - $commission, 2),
                'status' => $case['status'],
            ])->save();

            $slot->update(['isBooked' => in_array($case['status'], ['Confirmed', 'Completed'], true)]);

            $paymentIntent = "pi_wanas_demo_{$index}";
            $payment = Payment::query()->where('stripePaymentIntentId', $paymentIntent)->first();
            if ($payment && $payment->bookingId !== $booking->id) {
                throw new RuntimeException("Fake payment intent [{$paymentIntent}] is already attached to a different booking.");
            }
            $otherPayment = Payment::query()
                ->where('bookingId', $booking->id)
                ->where(function ($query) use ($paymentIntent): void {
                    $query->whereNull('stripePaymentIntentId')->orWhere('stripePaymentIntentId', '!=', $paymentIntent);
                })
                ->first();
            if ($otherPayment) {
                throw new RuntimeException("Demo booking [{$booking->id}] already has a different payment; refusing to replace it.");
            }

            Payment::updateOrCreate(
                ['stripePaymentIntentId' => $paymentIntent],
                [
                    'bookingId' => $booking->id,
                    'amount' => $booking->amount,
                    'platformFee' => $booking->platformCommission,
                    'status' => $case['payment'],
                ],
            );

            if ($booking->status === 'Completed') {
                $review = Review::withTrashed()->firstOrNew(['bookingId' => $booking->id]);
                $review->fill([
                    'rating' => 5,
                    'comment' => 'شعرت بالإنصات والاحترام، وكانت الجلسة مفيدة في فهم خيارات الدعم المتاحة.',
                ])->save();
                if ($review->trashed()) {
                    $review->restore();
                }
            }
        }
    }

    /** @return array<int, SpecialistSlot> */
    private function fixtureSlots(Specialist $specialist): array
    {
        $definitions = [
            13,
            11,
            10,
            12,
            14,
        ];
        $slots = [];
        foreach ($definitions as $hour) {
            $slot = SpecialistSlot::query()
                ->where('specialistId', $specialist->id)
                ->whereTime('startTime', sprintf('%02d:00:00', $hour))
                ->firstOrFail();
            // Slot state is reconciled with the final demo booking status below.
            $slots[] = $slot;
        }

        return $slots;
    }
}
