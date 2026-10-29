<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Account\UpdatePasswordRequest;
use App\Models\Admin\User;
use App\Services\Account\PasswordService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    /** Percobaan gagal per kombinasi email + IP sebelum dikunci sementara */
    private const MAX_FAILED_ATTEMPTS = 5;
    private const LOCK_SECONDS = 60;

    public function login(Request $request)
    {
        $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required']
        ]);

        // Dicek sebelum password, sehingga password benar pun ditolak selama masih terkunci
        $throttleKey = 'login:' . sha1(Str::lower(trim($request->email)) . '|' . $request->ip());
        if (RateLimiter::tooManyAttempts($throttleKey, self::MAX_FAILED_ATTEMPTS)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return response()->json([
                'success' => false,
                'message' => "Terlalu banyak percobaan masuk. Coba lagi dalam {$seconds} detik.",
                'retry_after' => $seconds,
            ], 429, ['Retry-After' => $seconds]);
        }

        // validate() tidak membuat sesi login; API hanya memakai token
        if (!Auth::guard('web')->validate([
            'email' => $request->email,
            'password' => $request->password,
            'is_active' => true
        ])) {
            RateLimiter::hit($throttleKey, self::LOCK_SECONDS);

            return response()->json([
                'success' => false,
                'message' => 'Email atau Password salah'
            ],401);
        }

        RateLimiter::clear($throttleKey);

        $user = User::with('role')
            ->where('email',$request->email)
            ->first();

        // Password benar, tetapi profil siswa/tentor sudah dinonaktifkan Admin
        if (!$user->canAccessApp()) {
            return response()->json([
                'success' => false,
                'message' => 'Akun Anda sedang tidak aktif. Hubungi admin lembaga.'
            ],401);
        }

        $minutes = (int) config('sanctum.expiration');
        $expiresAt = $minutes > 0 ? now()->addMinutes($minutes) : null;
        $token = $user
            ->createToken('bimbel-token', ['*'], $expiresAt)
            ->plainTextToken;

        return response()->json([
            'success' => true,
            'token' => $token,
            'expires_at' => $expiresAt?->toIso8601String(),
            'user' => $user
        ]);
    }

    public function profile(Request $request)
    {
        return response()->json(
            $request->user()->load('role')
        );
    }

    // Admin & super admin mengganti password sendiri (peran lain lewat portal masing-masing)
    public function updatePassword(UpdatePasswordRequest $request, PasswordService $passwords)
    {
        $passwords->change($request->user(), $request->password);

        return response()->json(['success' => true, 'message' => 'Password diperbarui. Sesi di perangkat lain telah dikeluarkan.']);
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
