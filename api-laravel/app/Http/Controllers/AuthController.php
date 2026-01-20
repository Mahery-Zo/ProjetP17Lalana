<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\LoginAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role' => 'user',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ], 201);
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = User::where('email', $request->email)->first();

        // Check if user is blocked
        if ($user && $user->is_blocked) {
            return response()->json([
                'message' => 'Compte bloqué. Contactez un administrateur.'
            ], 403);
        }

        // Check login attempts
        $maxAttempts = config('auth.max_login_attempts', 3);
        $attempts = LoginAttempt::where('email', $request->email)
            ->where('created_at', '>', now()->subMinutes(15))
            ->count();

        if ($attempts >= $maxAttempts) {
            if ($user) {
                $user->update(['is_blocked' => true]);
            }
            return response()->json([
                'message' => 'Trop de tentatives. Compte bloqué.'
            ], 429);
        }

        if (!$user || !Hash::check($request->password, $user->password)) {
            // Record failed attempt
            LoginAttempt::create(['email' => $request->email]);
            
            return response()->json([
                'message' => 'Identifiants incorrects'
            ], 401);
        }

        // Clear login attempts on success
        LoginAttempt::where('email', $request->email)->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'access_token' => $token,
            'token_type' => 'Bearer',
            'user' => $user
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Déconnexion réussie']);
    }

    public function user(Request $request)
    {
        return response()->json($request->user());
    }
}
