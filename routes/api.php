<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Admin\AdminAuthController;
use App\Http\Controllers\Api\Admin\AdminDashboardController;
use App\Http\Controllers\Api\Admin\SpecialistVerificationController;
use App\Http\Controllers\Api\Admin\FacilitatorApplicationController;
use App\Http\Controllers\Api\Admin\ReportController;
use App\Http\Controllers\Api\Admin\UserManagementController;

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

});

