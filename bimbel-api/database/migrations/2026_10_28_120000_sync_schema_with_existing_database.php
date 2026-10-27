<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Menyamakan hasil migration dengan database yang sudah berjalan: perubahan berikut dulu
     * dilakukan langsung di database tanpa migration. Semua perintah idempoten, jadi aman
     * dijalankan ulang dan tidak mengubah apa pun pada database yang sudah sesuai.
     */
    public function up(): void
    {
        // Alasan reschedule / pembatalan sesi (dipakai fitur jadwal)
        DB::statement('ALTER TABLE academic.schedule_sessions ADD COLUMN IF NOT EXISTS reason varchar(30)');

        // Materi boleh tanpa tentor penyusun
        DB::statement('ALTER TABLE academic.materials ALTER COLUMN tentor_id DROP NOT NULL');

        // Kurikulum mengikuti jenjang (education_level_id); kolom teks lama opsional
        DB::statement('ALTER TABLE academic.curriculums ALTER COLUMN education_level DROP NOT NULL');
        DB::statement('ALTER TABLE academic.curriculums ALTER COLUMN education_level_id SET NOT NULL');

        // Mapel kelas selalu berasal dari mapel paket
        DB::statement('ALTER TABLE academic.class_subjects ALTER COLUMN package_subject_id SET NOT NULL');

        // Nilai bawaan tabel ujian
        DB::statement('ALTER TABLE exam.exams ALTER COLUMN id SET DEFAULT public.uuid_generate_v4()');
        DB::statement('ALTER TABLE exam.exams ALTER COLUMN created_at SET DEFAULT CURRENT_TIMESTAMP');
        DB::statement('ALTER TABLE exam.exams ALTER COLUMN updated_at SET DEFAULT CURRENT_TIMESTAMP');
    }

    /**
     * Sengaja tidak membalik apa pun: kondisi di atas adalah kondisi yang dipakai aplikasi,
     * dan rollback pada database produksi bisa menghapus data (kolom reason).
     */
    public function down(): void
    {
    }
};
