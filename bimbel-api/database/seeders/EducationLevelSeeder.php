<?php

namespace Database\Seeders;

use App\Models\Admin\EducationLevel;
use Illuminate\Database\Seeder;

/**
 * Jenjang & tingkat kelas bawaan (TK, SD, SMP, SMA).
 */
class EducationLevelSeeder extends Seeder
{
    public function run(): void
    {
        $levels = [
            ['TK-A', 'TK', 1, 'TK Kelas A', 0], ['TK-B', 'TK', 2, 'TK Kelas B', 0],
            ['SD-1', 'SD', 1, 'SD Kelas 1', 1], ['SD-2', 'SD', 2, 'SD Kelas 2', 2], ['SD-3', 'SD', 3, 'SD Kelas 3', 3],
            ['SD-4', 'SD', 4, 'SD Kelas 4', 4], ['SD-5', 'SD', 5, 'SD Kelas 5', 5], ['SD-6', 'SD', 6, 'SD Kelas 6', 6],
            ['SMP-1', 'SMP', 7, 'SMP Kelas 7', 7], ['SMP-8', 'SMP', 8, 'SMP Kelas 8', 8], ['SMP-9', 'SMP', 9, 'SMP Kelas 9', 9],
            ['SMA-10', 'SMA', 10, 'SMA Kelas 10', 10], ['SMA-11', 'SMA', 11, 'SMA Kelas 11', 11], ['SMA-12', 'SMA', 12, 'SMA Kelas 12', 12],
        ];

        foreach ($levels as [$code, $level, $grade, $display, $order]) {
            EducationLevel::firstOrCreate(['level_code' => $code], [
                'education_level' => $level,
                'grade_level'     => $grade,
                'display_name'    => $display,
                'sort_order'      => $order,
                'is_active'       => true,
                'description'     => "Jenjang {$level} dan " . preg_replace('/^\w+ /', '', $display),
            ]);
        }
    }
}
