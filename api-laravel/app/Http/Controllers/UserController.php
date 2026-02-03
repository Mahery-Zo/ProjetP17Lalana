<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\LoginAttempt;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Log;
use Kreait\Laravel\Firebase\Facades\Firebase;

class UserController extends Controller
{
    public function update(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $request->user()->id,
            'password' => 'sometimes|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        
        if ($request->has('name')) {
            $user->name = $request->name;
        }
        
        if ($request->has('email')) {
            $user->email = $request->email;
        }
        
        if ($request->has('password')) {
                $user->password = Hash::make($request->password);
            }
        
        $user->save();

        return response()->json($user);
    }

    public function blockedUsers()
    {
        $users = User::where('is_blocked', true)->get();
        return response()->json($users);
    }

    public function unblock($id)
    {
        $user = User::findOrFail($id);
        $user->update(['is_blocked' => false]);
        
        // Clear login attempts
        LoginAttempt::where('email', $user->email)->delete();

        return response()->json(['message' => 'Utilisateur débloqué', 'user' => $user]);
    }

    public function getAllUsersForFirebase(Request $request)
{
    // OPTIONAL: simple security check (recommended)
    // Header: X-IMPORT-KEY: your-secret-key
    if ($request->header('X-IMPORT-KEY') !== config('app.firebase_import_key')) {
        return response()->json(['message' => 'Unauthorized'], 401);
    }

    // Pagination (important for large DB)
    $perPage = (int) $request->query('per_page', 1000);

    $users = User::query()
        ->select([
            'id',
            'name',
            'email',
            'password',
            'email_verified_at',
            'role',
            'is_blocked',
            'created_at'
        ])
        ->orderBy('id')
        ->paginate($perPage);

    $data = $users->getCollection()->map(function ($user) {
        return [
            'uid' => (string) $user->id,
            'email' => $user->email,
            'displayName' => $user->name,
            'passwordHashBcrypt' => $user->password, // 👈 bcrypt hash
            'emailVerified' => $user->email_verified_at !== null,
            'disabled' => (bool) $user->is_blocked,
            'role' => $user->role, // optional (for Firebase custom claims later)
        ];
    });

    return response()->json([
        'data' => $data,
        'meta' => [
            'current_page' => $users->currentPage(),
            'last_page' => $users->lastPage(),
            'per_page' => $users->perPage(),
            'total' => $users->total(),
        ],
    ]);
}

}
