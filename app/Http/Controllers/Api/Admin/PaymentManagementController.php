<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class PaymentManagementController extends Controller
{
    // Display payments with search, filters, and pagination.
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => [
                'nullable',
                Rule::in(['succeeded', 'failed', 'refunded']),
            ],
            'per_page' => ['nullable', 'integer', Rule::in([10, 25, 50])],
        ]);

        $query = Payment::query()->with([
            'booking.user:id,name,email',
            'booking.specialist.user:id,name,email',
            'booking.slot',
        ]);

        if (!empty($validated['search'])) {
            $search = $validated['search'];

            $query->where(function ($builder) use ($search) {
                $builder->where('id', $search)
                    ->orWhere('stripePaymentIntentId', 'like', "%{$search}%")
                    ->orWhereHas('booking.user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    })
                    ->orWhereHas('booking.specialist.user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        $payments = $query->latest()->paginate(
            $validated['per_page'] ?? 10
        );

        return response()->json([
            'status' => 'success',
            'data' => $payments,
        ]);
    }

    // Display one payment with its booking details.
    public function show(int $payment): JsonResponse
    {
        $payment = Payment::with([
            'booking.user:id,name,email,phoneNumber',
            'booking.specialist.user:id,name,email,phoneNumber',
            'booking.specialist:id,userId,specialty,price',
            'booking.slot',
        ])->findOrFail($payment);

        return response()->json([
            'status' => 'success',
            'data' => $payment,
        ]);
    }
}

