<?php
namespace App\Services\Account;

use App\Models\Admin\User;
use Illuminate\Support\Facades\Hash;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Ganti password oleh pemilik akun (orang tua, tentor).
 */
class PasswordService {

    // Simpan password baru lalu keluarkan sesi login di perangkat lain
    public function change(User $user, string $password): void {
        $user->update(['password' => Hash::make($password)]);

        $current = $user->currentAccessToken();
        $user->tokens()
            ->when($current instanceof PersonalAccessToken, fn($q) => $q->where('id', '!=', $current->id))
            ->delete();
    }
}
