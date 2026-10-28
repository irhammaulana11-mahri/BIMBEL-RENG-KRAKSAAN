<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Titik rumah keluarga di data orang tua. Disinkronkan dua arah dengan home_* siswa
     * (FamilyAddressService) agar alamat & pin di profil orang tua dan siswa selalu sama.
     */
    public function up(): void
    {
        Schema::table('master.parents', function (Blueprint $table) {
            $table->decimal('latitude', 10, 8)->nullable();
            $table->decimal('longitude', 11, 8)->nullable();
        });

        // Isi awal: orang tua mengambil alamat/titik rumah anak yang sudah diisi
        DB::statement("
            UPDATE master.parents p
            SET address = COALESCE(NULLIF(p.address, ''), s.home_address),
                latitude = s.home_latitude,
                longitude = s.home_longitude
            FROM master.parent_students ps
            JOIN master.students s ON s.id = ps.student_id
            WHERE ps.parent_id = p.id AND s.home_latitude IS NOT NULL
        ");
    }

    public function down(): void
    {
        Schema::table('master.parents', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude']);
        });
    }
};
