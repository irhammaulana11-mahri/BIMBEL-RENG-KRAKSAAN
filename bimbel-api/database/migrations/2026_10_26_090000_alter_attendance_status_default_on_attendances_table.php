<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Samakan nilai attendance_status dengan konvensi aplikasi
     * (HADIR, IZIN, SAKIT, ALPA) pada absensi siswa dan tentor.
     */
    public function up(): void
    {
        foreach (['academic.student_attendances', 'academic.tentor_attendances'] as $table) {
            DB::statement("UPDATE {$table} SET attendance_status = 'HADIR' WHERE attendance_status = 'PRESENT'");
            DB::statement("ALTER TABLE {$table} ALTER COLUMN attendance_status SET DEFAULT 'HADIR'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        foreach (['academic.student_attendances', 'academic.tentor_attendances'] as $table) {
            DB::statement("ALTER TABLE {$table} ALTER COLUMN attendance_status SET DEFAULT 'PRESENT'");
        }
    }
};
