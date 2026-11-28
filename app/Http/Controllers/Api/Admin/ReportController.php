<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Report;
use App\Models\User;
use App\Models\Event;
use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class ReportController extends Controller
{
    // Get reports with search, filters, and pagination.
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(['Open', 'Resolved', 'Dismissed'])],
            'target_type' => ['nullable', Rule::in(['user', 'event', 'group'])],
            'per_page' => ['nullable', 'integer', Rule::in([10, 25, 50])],
        ]);

        $query = Report::query()->with('reporter');

        if (!empty($validated['search'])) {
            $search = $validated['search'];

            $query->where(function ($builder) use ($search) {
                $builder->where('description', 'like', "%{$search}%")
                    ->orWhere('category', 'like', "%{$search}%")
                    ->orWhereHas('reporter', function ($reporterQuery) use ($search) {
                        $reporterQuery->where('name', 'like', "%{$search}%")
                            ->orWhere('email', 'like', "%{$search}%");
                    });
            });
        }

        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (!empty($validated['target_type'])) {
            $query->where('targetType', $validated['target_type']);
        }

        $reports = $query->latest()->paginate($validated['per_page'] ?? 10);

        $reports->getCollection()->transform(function (Report $report) {
            $report->target_details = $this->getTargetDetails($report);

            return $report;
        });

        return response()->json([
            'status' => 'success',
            'data' => $reports,
        ]);
    }

    // Get one report with its target details.
    public function show(Report $report): JsonResponse
    {
        $report->load('reporter');
        $report->target_details = $this->getTargetDetails($report);

        return response()->json([
            'status' => 'success',
            'data' => $report,
        ]);
    }

    // Update the report status.
    public function updateStatus(Request $request, Report $report): JsonResponse
    {
        $validated = $request->validate([
            'status' => [
                'required',
                Rule::in(['Open', 'Resolved', 'Dismissed']),
            ],
        ]);

        $report->update([
            'status' => $validated['status'],
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'تم تحديث حالة البلاغ بنجاح.',
            'data' => $report->fresh()->load('reporter'),
        ]);
    }

    // Resolve the reported user, event, or group.
    private function getTargetDetails(Report $report): array
    {
        $target = match ($report->targetType) {
            'user' => User::withTrashed()->find($report->targetId),
            'event' => Event::withTrashed()->find($report->targetId),
            'group' => Group::withTrashed()->find($report->targetId),
            default => null,
        };

        if (!$target) {
            return [
                'name' => 'العنصر غير موجود أو تم حذفه',
                'status' => null,
            ];
        }

        $name = match ($report->targetType) {
            'user' => $target->name,
            'event', 'group' => $target->title ?? 'بدون عنوان',
            default => 'غير معروف',
        };

        return [
            'name' => $name,
            'status' => $target->status ?? null,
        ];
    }
}
