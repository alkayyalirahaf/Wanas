<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class UserManagementController extends Controller
{
    // Get users with search, filters, and pagination.
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'role' => ['nullable', Rule::in(['specialist', 'facilitator', 'member'])],
            'status' => ['nullable', Rule::in(['Pending', 'Active', 'Blocked', 'Rejected'])],
            'deleted' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', Rule::in([10, 25, 50])],
        ]);

        $query = User::query()->with('blockedByAdmin:id,name')->where('role', '!=', 'admin');

        // Include soft-deleted users only when requested.
        if (!empty($validated['deleted'])) {
            $query->onlyTrashed();
        }

        // Search by name, email, or phone number.
        if (!empty($validated['search'])) {
            $search = $validated['search'];

            $query->where(function ($builder) use ($search) {
                $builder->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phoneNumber', 'like', "%{$search}%");
            });
        }

        // Filter by role.
        if (!empty($validated['role'])) {
            $query->where('role', $validated['role']);
        }

        // Filter by account status.
        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        $users = $query->latest()->paginate($validated['per_page'] ?? 10);

        return response()->json([
            'status' => 'success',
            'data' => $users,
        ]);
    }

    // Get one user's details.
    public function show(int $user): JsonResponse
    {
        $user = User::with('blockedByAdmin:id,name')
            ->where('role', '!=', 'admin')
            ->findOrFail($user);

        return response()->json([
            'status' => 'success',
            'data' => $user,
        ]);
    }

    // Block an active user and save the blocking details.
    public function block(Request $request, int $user): JsonResponse
    {
        $validated = $request->validate([
            'blockReason' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        $user = User::where('role', '!=', 'admin')->findOrFail($user);

        if ($user->status !== 'Active') {
            return response()->json([
                'status' => 'error',
                'message' => 'لا يمكن حظر هذا المستخدم، يجب أن تكون حالة الحساب Active.',
            ], 422);
        }

        $user->status = 'Blocked';
        $user->blockReason = $validated['blockReason'];
        $user->blockedBy = auth()->id();
        $user->blockedAt = now();
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'تم حظر المستخدم بنجاح.',
            'data' => $user,
        ]);
    }

    // Unblock a blocked user and clear the current blocking details.
    public function unblock(int $user): JsonResponse
    {
        $user = User::where('role', '!=', 'admin')->findOrFail($user);

        if ($user->status !== 'Blocked') {
            return response()->json([
                'status' => 'error',
                'message' => 'لا يمكن فك الحظر، حالة المستخدم ليست Blocked.',
            ], 422);
        }

        $user->status = 'Active';
        $user->blockReason = null;
        $user->blockedBy = null;
        $user->blockedAt = null;
        $user->save();

        return response()->json([
            'status' => 'success',
            'message' => 'تم فك الحظر عن المستخدم بنجاح.',
            'data' => $user,
        ]);
    }

    // Soft delete a user.
    public function destroy(int $user): JsonResponse
    {
        $user = User::where('role', '!=', 'admin')->findOrFail($user);

        $user->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'تم حذف المستخدم بنجاح.',
        ]);
    }

    // Restore a soft-deleted user.
    public function restore(int $user): JsonResponse
    {
        $user = User::onlyTrashed()
            ->where('role', '!=', 'admin')
            ->findOrFail($user);

        $user->restore();

        return response()->json([
            'status' => 'success',
            'message' => 'تمت استعادة المستخدم بنجاح.',
            'data' => $user,
        ]);
    }
}
