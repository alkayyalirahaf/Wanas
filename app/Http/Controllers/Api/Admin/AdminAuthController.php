<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminAuthController extends Controller
{
    public function login(Request $request)
    {
        // Validate the incoming data
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // Find an active admin by email
        $admin = User::where('email', $credentials['email'])
            ->where('role', 'admin')
            ->where('status', 'Active')
            ->first();

        // Check if the admin exists and the password is correct
        if (!$admin || !Hash::check($credentials['password'], $admin->password)) {
            return response()->json([
                'message' => 'Invalid credentials.',
            ], 401);
        }

        // Create a Sanctum token
        $token = $admin->createToken('admin-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'token' => $token,
            'admin' => [
                'id' => $admin->getKey(),
                'name' => $admin->name,
                'email' => $admin->email,
                'role' => $admin->role,
            ],
        ], 200);
    }



    public function logout(Request $request)
    {
        // Delete the current access token
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout successful.',
        ], 200);
    }
}
