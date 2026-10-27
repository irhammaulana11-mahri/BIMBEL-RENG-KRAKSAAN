<?php

namespace Database\Seeders;

use App\Models\Admin\Role;
use Illuminate\Database\Seeder;

/**
 * Peran login. Nama peran dipakai langsung oleh middleware role:... dan frontend.
 */
class RoleSeeder extends Seeder
{
    public const ROLES = ['super_admin', 'admin', 'tentor', 'orang_tua', 'siswa'];

    public function run(): void
    {
        foreach (self::ROLES as $name) {
            Role::firstOrCreate(['role_name' => $name]);
        }
    }
}
