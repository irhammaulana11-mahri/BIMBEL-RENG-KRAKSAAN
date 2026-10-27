<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Data acuan untuk server baru (aman dijalankan berulang):
     *   php artisan migrate --seed
     */
    public function run(): void
    {
        $this->call([
            RoleSeeder::class,
            EducationLevelSeeder::class,
            PackageSeeder::class,
            CompanyProfileSeeder::class,
            AdminUserSeeder::class,
        ]);
    }
}
