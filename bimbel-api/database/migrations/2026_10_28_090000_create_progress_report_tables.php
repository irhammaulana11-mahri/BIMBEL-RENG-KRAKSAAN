<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Rapor perkembangan siswa.
     *
     * Rapor bulanan per siswa per kelas: kehadiran + nilai ujian (dihitung otomatis)
     * + catatan tentor per mapel + catatan umum Admin.
     * DRAFT    : angka dihitung langsung dari absensi & hasil ujian
     * PUBLISHED: angka dibekukan di kolom snapshot, terlihat oleh orang tua & siswa
     */
    public function up(): void
    {
        Schema::create('academic.progress_reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('student_id');
            $table->uuid('class_id');
            $table->smallInteger('period_year');
            $table->smallInteger('period_month');
            $table->string('status', 20)->default('DRAFT');
            $table->text('general_note')->nullable();
            $table->jsonb('snapshot')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->uuid('published_by')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('student_id')->references('id')->on('master.students')->cascadeOnDelete();
            $table->foreign('class_id')->references('id')->on('academic.classes')->cascadeOnDelete();
            $table->unique(['student_id', 'class_id', 'period_year', 'period_month'], 'uq_progress_reports_student_class_period');
            $table->index(['period_year', 'period_month'], 'idx_progress_reports_period');
        });

        DB::statement("
            ALTER TABLE academic.progress_reports
            ADD CONSTRAINT progress_reports_status_check
            CHECK (status IN ('DRAFT', 'PUBLISHED'))
        ");

        DB::statement("
            ALTER TABLE academic.progress_reports
            ADD CONSTRAINT progress_reports_month_check
            CHECK (period_month BETWEEN 1 AND 12)
        ");

        // Catatan tentor per siswa per mapel per bulan (bisa ditulis sebelum rapor dibuat)
        Schema::create('academic.progress_report_notes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('student_id');
            $table->uuid('class_id');
            $table->uuid('subject_id');
            $table->uuid('tentor_id')->nullable();
            $table->smallInteger('period_year');
            $table->smallInteger('period_month');
            $table->text('note');
            $table->timestamps();

            $table->foreign('student_id')->references('id')->on('master.students')->cascadeOnDelete();
            $table->foreign('class_id')->references('id')->on('academic.classes')->cascadeOnDelete();
            $table->foreign('subject_id')->references('id')->on('master.subjects')->cascadeOnDelete();
            $table->foreign('tentor_id')->references('id')->on('master.tentors')->nullOnDelete();
            $table->unique(['student_id', 'class_id', 'subject_id', 'period_year', 'period_month'], 'uq_progress_report_notes_subject_period');
            $table->index(['class_id', 'period_year', 'period_month'], 'idx_progress_report_notes_class_period');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('academic.progress_report_notes');
        Schema::dropIfExists('academic.progress_reports');
    }
};
