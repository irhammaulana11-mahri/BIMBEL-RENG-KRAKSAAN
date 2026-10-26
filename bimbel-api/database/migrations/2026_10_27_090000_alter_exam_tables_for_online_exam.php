<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Ujian online oleh siswa.
     *
     * Akses ujian:
     * - Saat sesi KBM: lewat academic.session_activities (EXAM) yang sedang berjalan
     * - Terjadwal: opens_at / closes_at untuk kelas pada exam.exam_classes
     *
     * Satu siswa satu attempt per aktivitas sesi, atau satu attempt per exam terjadwal.
     */
    public function up(): void
    {
        /*
        |--------------------------------------------------------------------------
        | EXAMS
        |--------------------------------------------------------------------------
        | tutor_id opsional karena exam juga disiapkan oleh Admin.
        */

        DB::statement('ALTER TABLE exam.exams ALTER COLUMN tutor_id DROP NOT NULL');

        Schema::table('exam.exams', function (Blueprint $table) {
            $table->text('description')->nullable();
            $table->string('status', 20)->default('DRAFT');
            $table->timestamp('opens_at')->nullable();
            $table->timestamp('closes_at')->nullable();
            $table->uuid('created_by')->nullable();

            $table->index('status', 'idx_exams_status');
            $table->index('subject_id', 'idx_exams_subject');
            $table->index(['opens_at', 'closes_at'], 'idx_exams_schedule');
        });

        DB::statement("
            ALTER TABLE exam.exams
            ADD CONSTRAINT exams_status_check
            CHECK (status IN ('DRAFT', 'PUBLISHED', 'ARCHIVED'))
        ");

        DB::statement("
            ALTER TABLE exam.exams
            ADD CONSTRAINT exams_schedule_check
            CHECK (opens_at IS NULL OR closes_at IS NULL OR closes_at > opens_at)
        ");

        /*
        |--------------------------------------------------------------------------
        | EXAM CLASSES (peserta ujian terjadwal)
        |--------------------------------------------------------------------------
        */

        Schema::create('exam.exam_classes', function (Blueprint $table) {
            // Default UUID dari database karena baris pivot dibuat lewat sync()
            $table->uuid('id')->primary()->default(DB::raw('uuid_generate_v4()'));
            $table->uuid('exam_id');
            $table->uuid('class_id');
            $table->timestamps();

            $table->foreign('exam_id', 'fk_exam_classes_exam')
                ->references('id')
                ->on('exam.exams')
                ->cascadeOnDelete();

            $table->foreign('class_id', 'fk_exam_classes_class')
                ->references('id')
                ->on('academic.classes')
                ->cascadeOnDelete();

            $table->unique(['exam_id', 'class_id'], 'uq_exam_classes_exam_class');
            $table->index('class_id', 'idx_exam_classes_class');
        });

        /*
        |--------------------------------------------------------------------------
        | QUESTIONS
        |--------------------------------------------------------------------------
        */

        DB::statement("
            ALTER TABLE exam.questions
            ADD CONSTRAINT questions_type_check
            CHECK (question_type IN ('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY'))
        ");

        /*
        |--------------------------------------------------------------------------
        | EXAM RESULTS
        |--------------------------------------------------------------------------
        | Status: IN_PROGRESS -> SUBMITTED (menunggu nilai essay) -> GRADED
        */

        Schema::table('exam.exam_results', function (Blueprint $table) {
            $table->dropUnique('uq_exam_results_exam_student');

            $table->uuid('session_activity_id')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('graded_at')->nullable();
            $table->uuid('graded_by')->nullable();

            $table->foreign('session_activity_id', 'fk_exam_results_session_activity')
                ->references('id')
                ->on('academic.session_activities')
                ->nullOnDelete();

            $table->index('session_activity_id', 'idx_exam_results_session_activity');
        });

        DB::statement("
            CREATE UNIQUE INDEX uq_exam_results_activity_student
            ON exam.exam_results (session_activity_id, student_id)
            WHERE session_activity_id IS NOT NULL
        ");

        DB::statement("
            CREATE UNIQUE INDEX uq_exam_results_scheduled_student
            ON exam.exam_results (exam_id, student_id)
            WHERE session_activity_id IS NULL
        ");

        DB::statement("
            ALTER TABLE exam.exam_results
            ADD CONSTRAINT exam_results_status_check
            CHECK (status IN ('IN_PROGRESS', 'SUBMITTED', 'GRADED'))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE exam.exam_results DROP CONSTRAINT IF EXISTS exam_results_status_check');
        DB::statement('DROP INDEX IF EXISTS exam.uq_exam_results_scheduled_student');
        DB::statement('DROP INDEX IF EXISTS exam.uq_exam_results_activity_student');

        // Index berada di schema exam (di luar search_path), jadi di-drop dengan nama lengkap
        DB::statement('DROP INDEX IF EXISTS exam.idx_exam_results_session_activity');

        Schema::table('exam.exam_results', function (Blueprint $table) {
            $table->dropForeign('fk_exam_results_session_activity');
            $table->dropColumn(['session_activity_id', 'expires_at', 'graded_at', 'graded_by']);
            $table->unique(['exam_id', 'student_id'], 'uq_exam_results_exam_student');
        });

        DB::statement('ALTER TABLE exam.questions DROP CONSTRAINT IF EXISTS questions_type_check');

        Schema::dropIfExists('exam.exam_classes');

        DB::statement('ALTER TABLE exam.exams DROP CONSTRAINT IF EXISTS exams_schedule_check');
        DB::statement('ALTER TABLE exam.exams DROP CONSTRAINT IF EXISTS exams_status_check');

        DB::statement('DROP INDEX IF EXISTS exam.idx_exams_status');
        DB::statement('DROP INDEX IF EXISTS exam.idx_exams_subject');
        DB::statement('DROP INDEX IF EXISTS exam.idx_exams_schedule');

        Schema::table('exam.exams', function (Blueprint $table) {
            $table->dropColumn(['description', 'status', 'opens_at', 'closes_at', 'created_by']);
        });
    }
};
