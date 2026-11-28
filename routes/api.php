<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Admin\AdminAuthController;
use App\Http\Controllers\Api\Admin\AdminDashboardController;
use App\Http\Controllers\Api\Admin\SpecialistVerificationController;
use App\Http\Controllers\Api\Admin\FacilitatorApplicationController;
use App\Http\Controllers\Api\Admin\ReportController;
use App\Http\Controllers\Api\Admin\UserManagementController;
use App\Http\Controllers\Api\Admin\GroupManagementController;
use App\Http\Controllers\Api\Admin\EventManagementController;
use App\Http\Controllers\Api\Admin\PaymentManagementController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');



//admin
Route::post('/admin/login', [AdminAuthController::class, 'login']);

Route::middleware(['auth:sanctum', 'admin'])->group(function () {

    Route::get('/admin/me', function (Request $request) {
        return response()->json([
            'admin' => $request->user(),
        ]);
    });

    Route::post('/admin/logout', [AdminAuthController::class, 'logout']);
    Route::get('/admin/stats', [AdminDashboardController::class, 'index']);

    //specialist
    Route::get('/admin/specialist-verifications', [SpecialistVerificationController::class, 'index']);
    Route::get('/admin/verification-documents/{document}', [SpecialistVerificationController::class, 'showDocument']);
    Route::patch('/admin/specialist-verifications/{specialist}/approve', [SpecialistVerificationController::class, 'approve']);
    Route::patch('/admin/specialist-verifications/{specialist}/reject', [SpecialistVerificationController::class, 'reject']);

    //Facilitor 
    Route::get('/admin/facilitator-applications', [FacilitatorApplicationController::class, 'index']);
    Route::patch('/admin/facilitator-applications/{application}/approve', [FacilitatorApplicationController::class, 'approve']);
    Route::patch('/admin/facilitator-applications/{application}/reject', [FacilitatorApplicationController::class, 'reject']);

    //Reorts 
    Route::get('/admin/reports', [ReportController::class, 'index']);
    Route::get('/admin/reports/{report}', [ReportController::class, 'show']);
    Route::patch('/admin/reports/{report}/status', [ReportController::class, 'updateStatus']);

    // User Management
    Route::get('/admin/users', [UserManagementController::class, 'index']);
    Route::get('/admin/users/{user}', [UserManagementController::class, 'show']);

    Route::patch('/admin/users/{user}/block', [UserManagementController::class, 'block']);
    Route::patch('/admin/users/{user}/unblock', [UserManagementController::class, 'unblock']);

    Route::delete('/admin/users/{user}', [UserManagementController::class, 'destroy']);
    Route::patch('/admin/users/{user}/restore', [UserManagementController::class, 'restore']);

    // Group Management
    Route::get('/admin/groups', [GroupManagementController::class, 'index']);
    Route::get('/admin/groups/{group}', [GroupManagementController::class, 'show']);

    Route::patch('/admin/groups/{group}/archive', [GroupManagementController::class, 'archive']);
    Route::patch('/admin/groups/{group}/activate', [GroupManagementController::class, 'activate']);

    Route::delete('/admin/groups/{group}', [GroupManagementController::class, 'destroy']);
    Route::patch('/admin/groups/{group}/restore', [GroupManagementController::class, 'restore']);


    // Event Management
    Route::get('/admin/events', [EventManagementController::class, 'index']);
    Route::get('/admin/events/{event}', [EventManagementController::class, 'show']);

    Route::delete('/admin/events/{event}', [EventManagementController::class, 'destroy']);
    Route::patch('/admin/events/{event}/restore', [EventManagementController::class, 'restore']);

    // Payment Management
    Route::get('/admin/payments', [PaymentManagementController::class, 'index']);
    Route::get('/admin/payments/{payment}', [PaymentManagementController::class, 'show']);
});

