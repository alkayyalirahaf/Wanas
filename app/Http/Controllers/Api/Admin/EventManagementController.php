<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;

class EventManagementController extends Controller
{
    // Get events with search, filters, and pagination.
    public function index(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', Rule::in(['Draft', 'Published', 'Canceled'])],
            'locationType' => ['nullable', Rule::in(['online', 'indoor', 'outdoor'])],
            'deleted' => ['nullable', 'boolean'],
            'per_page' => ['nullable', 'integer', Rule::in([10, 25, 50])],
        ]);

        $query = Event::query()->with([
            'host:id,name,email,role',
            'group:id,title',
            'deletedByAdmin:id,name',
        ]);

        if (!empty($validated['deleted'])) {
            $query->onlyTrashed();
        }

        // Search by event title, host name, or group title.
        if (!empty($validated['search'])) {
            $search = $validated['search'];

            $query->where(function ($builder) use ($search) {
                $builder->where('title', 'like', "%{$search}%")
                    ->orWhereHas('host', function ($hostQuery) use ($search) {
                        $hostQuery->where('name', 'like', "%{$search}%");
                    })
                    ->orWhereHas('group', function ($groupQuery) use ($search) {
                        $groupQuery->where('title', 'like', "%{$search}%");
                    });
            });
        }

        if (!empty($validated['status'])) {
            $query->where('status', $validated['status']);
        }

        if (!empty($validated['locationType'])) {
            $query->where('locationType', $validated['locationType']);
        }

        $events = $query->latest()->paginate(
            $validated['per_page'] ?? 10
        );

        return response()->json([
            'status' => 'success',
            'data' => $events,
        ]);
    }

    // Get one event's details, including deleted events.
    public function show(int $event): JsonResponse
    {
        $event = Event::withTrashed()
            ->with([
                'host:id,name,email,role',
                'group:id,title',
                'deletedByAdmin:id,name',
            ])
            ->findOrFail($event);

        return response()->json([
            'status' => 'success',
            'data' => $event,
        ]);
    }

    // Soft delete an event with a required reason.
    public function destroy(Request $request, int $event): JsonResponse
    {
        $validated = $request->validate([
            'deletionReason' => ['required', 'string', 'min:5', 'max:1000'],
        ]);

        $event = Event::findOrFail($event);

        $event->deletionReason = $validated['deletionReason'];
        $event->deletedBy = auth()->id();
        $event->save();

        $event->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'تم حذف الفعالية بنجاح.',
            'data' => $event,
        ]);
    }

    // Restore a soft-deleted event.
    public function restore(int $event): JsonResponse
    {
        $event = Event::onlyTrashed()->findOrFail($event);

        $event->restore();

        return response()->json([
            'status' => 'success',
            'message' => 'تمت استعادة الفعالية بنجاح.',
            'data' => $event,
        ]);
    }
}
