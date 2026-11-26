<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Admin\AdminAuthController;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');



Route::post('/admin/login', [AdminAuthController::class, 'login']);



Route::middleware(['auth:sanctum', 'admin'])->group(function () {

    Route::get('/admin/me', function (Request $request) {
        return response()->json([
            'admin' => $request->user(),
        ]);
    });
    
    Route::post('/admin/logout', [AdminAuthController::class, 'logout']);

});
