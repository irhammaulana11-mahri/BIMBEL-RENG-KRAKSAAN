<?php

namespace Database\Seeders;

use App\Models\Admin\Role;
use App\Models\Admin\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Akun pertama untuk server baru. Atur di .env sebelum seeding:
 *   SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD (min 8 karakter), SEED_ADMIN_NAME (opsional)
 * Bila password tidak diisi, password acak dibuat dan ditampilkan sekali di terminal.
 *
 * Akun dibuat sebagai super_admin bila belum ada super admin (setup awal), selain itu sebagai admin.
 * Peran akun yang sudah ada tidak pernah diubah.
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
            $this->command?->info("Akun {$email} sudah ada, dilewati.");
            return;
        }

        $hasSuperAdmin = User::whereHas('role', fn($q) => $q->where('role_name', 'super_admin'))->exists();
        $roleName = $hasSuperAdmin ? 'admin' : 'super_admin';
        $password = env('SEED_ADMIN_PASSWORD') ?: Str::password(12, symbols: false);

        User::create([
            'role_id'   => Role::where('role_name', $roleName)->value('id'),
            'name'      => env('SEED_ADMIN_NAME', 'Administrator'),
            'email'     => $email,
            'password'  => Hash::make($password),
            'is_active' => true,
        ]);

        $this->command?->info("Akun {$roleName} dibuat: {$email}");
        if (!env('SEED_ADMIN_PASSWORD')) {
            $this->command?->warn("Password sementara (catat & segera ganti): {$password}");
        }
    }
}
