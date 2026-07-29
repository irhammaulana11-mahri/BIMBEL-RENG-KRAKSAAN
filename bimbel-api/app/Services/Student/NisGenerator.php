<?php

namespace App\Services\Student;

use App\Models\Admin\Student;
use Illuminate\Support\Facades\DB;

class NisGenerator {
    public function generate(): string {
        $year = now()->format('Y');

        $last = Student::query()
            ->where('nis', 'like', "STD{$year}%")
            ->select('nis')
            ->orderByDesc('nis')
            ->lockForUpdate()
            ->first();

        $sequence = 1;

        if ($last) {
            $sequence = (int) substr($last->nis, -5) + 1;
        }

        return sprintf(
            'STD%s%05d',
            $year,
            $sequence
        );
    }
}