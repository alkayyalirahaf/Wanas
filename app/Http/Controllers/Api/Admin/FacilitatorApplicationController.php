<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\FacilitatorApplication;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
class FacilitatorApplicationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = FacilitatorApplication::with('applicant')
            ->where('status', 'Pending')
            ->latest();

        // Search by applicant name, email, or phone number.
        if ($request->filled('search')) {
            $search = $request->search;

            $query->whereHas('applicant', function ($userQuery) use ($search) {
                $userQuery->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phoneNumber', 'like', "%{$search}%");
            });
        }

        // Filter by proposed topic.
        if ($request->filled('topic')) {
            $query->where('proposedTopic', 'like', '%' . $request->topic . '%');
        }

        // Allow only supported pagination sizes.
        $perPage = $request->input('per_page', 10);

        if (!in_array((int) $perPage, [10, 25, 50], true)) {
            $perPage = 10;
        }

        $applications = $query->paginate((int) $perPage);

        return response()->json([
            'status' => 'success',
            'data' => $applications,
        ]);
    }

    // Approve a facilitator application.
    public function approve(FacilitatorApplication $application): JsonResponse
    {
        $application->load('applicant');

        // Prevent reviewing the same application more than once.
        if ($application->status !== 'Pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'This application has already been reviewed.',
            ], 422);
        }

        DB::transaction(function () use ($application) {

            // Approve the application and record the reviewer.
            $application->update([
                'status' => 'Approved',
                'reviewedBy' => auth()->id(),
            ]);

            // Activate the facilitator account unless it is blocked.
            if ($application->applicant->status !== 'Blocked') {
                $application->applicant->update([
                    'role' => 'facilitator',
                    'status' => 'Active',
                ]);
            } else {
                $application->applicant->update([
                    'role' => 'facilitator',
                ]);
            }

            // Notify the applicant.
            $application->applicant->inAppNotifications()->create([
                'type' => 'facilitator_application',
                'message' => 'تم قبول طلب انضمامك كميسّر في منصة ونس. يمكنك الآن الاستفادة من ميزات الميسّرين.',
            ]);
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Facilitator application approved successfully.',
        ]);
    }


    // Reject a facilitator application.
    public function reject(
        Request $request,
        FacilitatorApplication $application
    ): JsonResponse {

        // Validate the rejection reason.
        $validated = $request->validate([
            'reason' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        $application->load('applicant');

        // Prevent reviewing the same application more than once.
        if ($application->status !== 'Pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'This application has already been reviewed.',
            ], 422);
        }

        DB::transaction(function () use ($application, $validated) {

            // Reject the application and record the reviewer.
            $application->update([
                'status' => 'Rejected',
                'reviewedBy' => auth()->id(),
                'reason' => $validated['reason'],
            ]);

            // Notify the applicant.
            $application->applicant->inAppNotifications()->create([
                'type' => 'facilitator_application',
                'message' => 'نعتذر، تم رفض طلب انضمامك كميسّر. السبب: ' . $validated['reason'],
            ]);
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Facilitator application rejected successfully.',
        ]);
    }
}
