<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\Admin\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required']
        ]);

        if (!Auth::attempt([
            'email' => $request->email,
            'password' => $request->password,
            'is_active' => true
        ])) {

            return response()->json([
                'success' => false,
                'message' => 'Email atau Password salah'
            ],401);
        }

        $user = User::with('role')
            ->where('email',$request->email)
            ->first();

        $token = $user
            ->createToken('bimbel-token')
            ->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
            'user' => $user
        ]);
    }

    public function profile(Request $request)
    {
        return response()->json(
            $request->user()->load('role')
        );
    }

    public function logout(Request $request)
    {
        $request->user()
            ->currentAccessToken()
            ->delete();

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil'
        ]);
    }
}