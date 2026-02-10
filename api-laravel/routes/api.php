<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\SignalementController;
use App\Http\Controllers\EntrepriseController;




/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public signalements (pour visiteurs)
Route::get('/signalements', [SignalementController::class, 'index']);
Route::get('/signalements/{id}', [SignalementController::class, 'show']);

// Public entreprises
Route::get('/entreprises', [EntrepriseController::class, 'index']);

// Firebase import (SANS auth:sanctum)
Route::middleware(['import.key'])->group(function () {
    Route::get('/firebase/users', [UserController::class, 'getAllUsersForFirebase']);
});


// Protected routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::put('/user/update', [UserController::class, 'update']);
    
    // Signalements (authentifié)
    Route::post('/signalements', [SignalementController::class, 'store']);
    Route::get('/signalements/user/mine', [SignalementController::class, 'mySignalements']);
 
    // Manager only routes
    Route::middleware('role:manager')->group(function () {
        Route::post('/sync/firebase', [SignalementController::class, 'syncFirebase']);
        Route::post('/push/firebase', [SignalementController::class, 'pushToFirebase']);
        Route::get('/users/blocked', [UserController::class, 'blockedUsers']);
        Route::post('/users/{id}/unblock', [UserController::class, 'unblock']);
        Route::put('/signalements/{id}/status', [SignalementController::class, 'updateStatus']);
        Route::put('/signalements/{id}/details', [SignalementController::class, 'updateDetails']);
        
        // Entreprises management
        Route::post('/entreprises', [EntrepriseController::class, 'store']);
        Route::put('/entreprises/{id}', [EntrepriseController::class, 'update']);
        Route::delete('/entreprises/{id}', [EntrepriseController::class, 'destroy']);


     

    });
});
