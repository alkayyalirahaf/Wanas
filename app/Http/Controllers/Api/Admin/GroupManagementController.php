<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Group;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class GroupManagementController extends Controller
{
    // Get groups with search, filters, and pagination.
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(['Active', 'Archived'])],
            'deleted' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', Rule::in([10, 25, 50])],
        ]);

        $query = Group::query()->with([
            'owner:id,name,email',
            'deletedByAdmin:id,name',
        ]);

        if (!empty($validated['deleted'])) {
            $query->onlyTrashed();
        }

        if (!empty($validated['search'])) {
            $search = $validated['search'];

            $query->where(function ($builder) use ($search) {
                $builder->where('title', 'like', "%{$search}%")
                    ->orWhere('topic', 'like', "%{$search}%")
                    ->orWhereHas('owner', function ($ownerQuery) use ($search) {
                        $ownerQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        $groups = $query->latest()->paginate($validated['per_page'] ?? 10);

        return response()->json([
            'status' => 'success',
            'data' => $groups,
        ]);
    }

    // Get one group's details.
    public function show(int $group): JsonResponse
    {
        $group = Group::withTrashed()
            ->with([
                'owner:id,name,email',
                'deletedByAdmin:id,name',
            ])
            ->findOrFail($group);

        return response()->json([
            'status' => 'success',
            'data' => $group,
        ]);
    }

    // Archive an active group.
    public function archive(int $group): JsonResponse
    {
        $group = Group::findOrFail($group);

        if ($group->status !== 'Active') {
            return response()->json([
                'status' => 'error',
                'message' => 'المجموعة ليست نشطة.',
            ], 422);
        }

        $group->update([
            'status' => 'Archived',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'تمت أرشفة المجموعة بنجاح.',
            'data' => $group,
        ]);
    }

    // Reactivate an archived group.
    public function activate(int $group): JsonResponse
    {
        $group = Group::findOrFail($group);

        if ($group->status !== 'Archived') {
            return response()->json([
                'status' => 'error',
                'message' => 'المجموعة ليست مؤرشفة.',
            ], 422);
        }

        $group->update([
            'status' => 'Active',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'تمت إعادة تفعيل المجموعة بنجاح.',
            'data' => $group,
        ]);
    }

    // Soft delete a group with a required reason.
    public function destroy(Request $request, int $group): JsonResponse
    {
        $validated = $request->validate([
            'deletionReason' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        $group = Group::findOrFail($group);

        $group->deletionReason = $validated['deletionReason'];
        $group->deletedBy = auth()->id();
        $group->save();

        $group->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'تم حذف المجموعة بنجاح.',
            'data' => $group,
        ]);
    }

    // Restore a soft-deleted group.
    public function restore(int $group): JsonResponse
    {
        $group = Group::onlyTrashed()->findOrFail($group);
        $group->restore();

        return response()->json([
            'status' => 'success',
            'message' => 'تمت استعادة المجموعة بنجاح.',
            'data' => $group,
        ]);
    }
}
