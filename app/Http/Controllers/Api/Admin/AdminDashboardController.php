<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\FacilitatorApplication;
use App\Models\Group;
use App\Models\Report;
use App\Models\User;
use Illuminate\Http\JsonResponse;

class AdminDashboardController extends Controller
{
    public function index(): JsonResponse
    {
        // Dashboard statistics
        $stats = [
            'total_users' => User::count(),

            'active_specialists' => User::where('role', 'specialist')
                ->where('status', 'Active')
                ->count(),

            'pending_specialists' => User::where('role', 'specialist')
                ->where('status', 'Pending')
                ->count(),

            'pending_facilitators' => FacilitatorApplication::where('status', 'Pending')
                ->count(),

            'open_reports' => Report::where('status', 'Open')
                ->count(),

            'total_groups' => Group::count(),

            'total_events' => Event::count(),
        ];

        // Users distribution by role
        $usersByRole = User::query()
            ->select('role')
            ->selectRaw('COUNT(*) as total')
            ->groupBy('role')
            ->get()
            ->map(fn($item) => [
                'role' => $item->role,
                'count' => (int) $item->total,
            ])
            ->values();

        // Events distribution by status
        $eventsByStatus = Event::query()
            ->select('status')
            ->selectRaw('COUNT(*) as total')
            ->groupBy('status')
            ->get()
            ->map(fn($item) => [
                'status' => $item->status,
                'count' => (int) $item->total,
            ])
            ->values();

        return response()->json([
            'status' => 'success',

            'data' => [
                'stats' => $stats,

                'charts' => [
                    'users_by_role' => $usersByRole,
                    'events_by_status' => $eventsByStatus,
                ],
            ],
        ]);
    }
}


