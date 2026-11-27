<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Specialist;
use Illuminate\Http\JsonResponse;
use App\Models\VerificationDocument;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;
class SpecialistVerificationController extends Controller
{
    // Get pending specialist verification requests
    public function index(Request $request): JsonResponse
    {
        // Validate search and filter parameters
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'specialty' => ['nullable', 'string', 'max:100'],
            'document_status' => [
                'nullable',
                'in:pending,approved,rejected',
            ],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ]);

        // Start with pending specialist requests
        $query = Specialist::query()
            ->with([
                'user:id,name,email,phoneNumber,status,role',
                'user.verificationDocuments:id,userId,documentType,fileUrl,status',
            ])
            ->where('status', 'pending')
            ->whereHas('user', function ($query) {
                $query->where('role', 'specialist');
            });

        // Search by name, email, phone number, or specialty
        if (!empty($filters['search'])) {
            $search = $filters['search'];

            $query->where(function ($query) use ($search) {
                $query->where('specialty', 'like', "%{$search}%")
                    ->orWhereHas('user', function ($userQuery) use ($search) {
                        $userQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%")
                            ->orWhere('phoneNumber', 'like', "%{$search}%");
                    });
            });
        }

        // Filter by specialist specialty
        if (!empty($filters['specialty'])) {
            $query->where('specialty', $filters['specialty']);
        }



        // Paginate results
        $perPage = $filters['per_page'] ?? 10;

        $specialists = $query
            ->latest()
            ->paginate($perPage)
            ->appends($request->query());


        $specialties = Specialist::query()
            ->whereNotNull('specialty')
            ->where('specialty', '!=', '')
            ->distinct()
            ->orderBy('specialty')
            ->pluck('specialty');

        return response()->json([
            'status' => 'success',
            'data' => $specialists,
            'specialties' => $specialties,
        ]);
    }



    // Display a private verification document for the admin.
    public function showDocument(VerificationDocument $document)
    {
        $path = $document->fileUrl;

        if (!Storage::disk('local')->exists($path)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Document file not found.',
            ], 404);
        }

        return Storage::disk('local')->response($path);
    }


    // Approve a specialist verification request.
    public function approve(Specialist $specialist): JsonResponse
    {
        $specialist->load('user');

        // Prevent reviewing the same request more than once.
        if ($specialist->status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'This verification request has already been reviewed.',
            ], 422);
        }

        DB::transaction(function () use ($specialist) {

            // Activate the specialist profile.
            $specialist->update([
                'status' => 'active',
            ]);

            // Activate the user account unless it is blocked.
            if ($specialist->user->status !== 'Blocked') {
                $specialist->user->update([
                    'status' => 'Active',
                ]);
            }

            // Approve all verification documents.
            $specialist->user->verificationDocuments()->update([
                'status' => 'approved',
            ]);

            // Create an in-app notification.
            $specialist->user->inAppNotifications()->create([
                'type' => 'specialist_verification',
                'message' => 'تم قبول طلب توثيق حسابك. يمكنك الآن الاستفادة من ميزات الأخصائي في منصة ونس.',
            ]);
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Specialist verification request approved successfully.',
        ]);
    }



    // Reject a specialist verification request.
    public function reject(Request $request, Specialist $specialist): JsonResponse
    {
        // Validate the rejection reason.
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        $specialist->load('user');

        // Prevent reviewing the same request more than once.
        if ($specialist->status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'This verification request has already been reviewed.',
            ], 422);
        }

        DB::transaction(function () use ($specialist, $validated) {

            // Reject the specialist profile.
            $specialist->update([
                'status' => 'rejected',
            ]);

            // Reject the user account unless it is blocked.
            if ($specialist->user->status !== 'Blocked') {
                $specialist->user->update([
                    'status' => 'Rejected',
                ]);
            }

            // Reject all verification documents.
            $specialist->user->verificationDocuments()->update([
                'status' => 'rejected',
            ]);

            // Notify the specialist and include the rejection reason.
            $specialist->user->inAppNotifications()->create([
                'type' => 'specialist_verification',
                'message' => 'تم رفض طلب توثيق حسابك. السبب: ' . $validated['reason'],
            ]);
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Specialist verification request rejected successfully.',
        ]);
    }
}
