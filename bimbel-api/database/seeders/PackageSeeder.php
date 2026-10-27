<?php

namespace Database\Seeders;

use App\Models\Website\Package;
use Illuminate\Database\Seeder;

/**
 * Paket bimbingan bawaan per jenjang & tipe kelas. Harga dapat diubah dari menu Paket.
 */
class PackageSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            'REGULER' => ['Reguler', 310800],
            'ONLINE'  => ['Online', 220000],
            'PRIVATE' => ['Home Visit', 310800],
        ];

        foreach (['SD', 'SMP', 'SMA'] as $level) {
            foreach ($types as $type => [$label, $price]) {
                Package::firstOrCreate(['package_code' => "{$level}-{$type}"], [
                    'package_name'      => "{$level} {$label}",
                    'education_level'   => $level,
                    'class_type'        => $type,
                    'default_price'     => $price,
                    'meeting_per_month' => 8,
                    'duration_minutes'  => 90,
                    'display_order'     => 0,
                    'is_active'         => true,
                ]);
            }
        }
    }
}
