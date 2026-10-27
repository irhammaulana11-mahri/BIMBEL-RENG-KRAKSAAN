<?php

namespace Database\Seeders;

use App\Models\Admin\Role;
use App\Models\Admin\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Akun admin pertama untuk server baru. Atur di .env sebelum seeding:
 *   SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD (min 8 karakter), SEED_ADMIN_NAME (opsional)
 * Bila password tidak diisi, password acak dibuat dan ditampilkan sekali di terminal.
 */
class AdminUserSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('SEED_ADMIN_EMAIL');
        if (!$email) {
            $this->command?->warn('SEED_ADMIN_EMAIL belum diatur di .env: akun admin tidak dibuat.');
            return;
        }

        if (User::where('email', $email)->exists()) {
            $this->command?->info("Akun admin {$email} sudah ada, dilewati.");
            return;
        }

        $password = env('SEED_ADMIN_PASSWORD') ?: Str::password(12, symbols: false);

        User::create([
            'role_id'   => Role::where('role_name', 'admin')->value('id'),
            'name'      => env('SEED_ADMIN_NAME', 'Administrator'),
            'email'     => $email,
            'password'  => Hash::make($password),
            'is_active' => true,
        ]);

        $this->command?->info("Akun admin dibuat: {$email}");
        if (!env('SEED_ADMIN_PASSWORD')) {
            $this->command?->warn("Password sementara (catat & segera ganti): {$password}");
        }
    }
}
