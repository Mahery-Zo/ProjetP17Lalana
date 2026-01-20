<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SignalementController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user/update', [UserController::class, 'update']);
    
    // Signalements
    Route::apiResource('signalements', SignalementController::class);
    Route::get('/signalements/user/mine', [SignalementController::class, 'mySignalements']);
    
    // Manager only routes
    Route::middleware('role:manager')->group(function () {
        Route::post('/sync/firebase', [SignalementController::class, 'syncFirebase']);
        Route::get('/users/blocked', [UserController::class, 'blockedUsers']);
        Route::post('/users/{id}/unblock', [UserController::class, 'unblock']);
        Route::put('/signalements/{id}/status', [SignalementController::class, 'updateStatus']);
        Route::put('/signalements/{id}/details', [SignalementController::class, 'updateDetails']);
    });
});
