<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create Exam Results Table
     */
    public function up(): void
    {
        Schema::create('exam.exam_results', function (Blueprint $table) {

            /*
            |--------------------------------------------------------------------------
            | PRIMARY KEY
            |--------------------------------------------------------------------------
            */

            $table->uuid('id')->primary();

            /*
            |--------------------------------------------------------------------------
            | RELATIONSHIP
            |--------------------------------------------------------------------------
            */

            $table->uuid('exam_id');

            $table->uuid('student_id');

            /*
            |--------------------------------------------------------------------------
            | RESULT
            |--------------------------------------------------------------------------
            */

            $table->decimal('score', 5, 2)
                  ->default(0);

            $table->unsignedInteger('total_correct')
                  ->default(0);

            $table->unsignedInteger('total_wrong')
                  ->default(0);

            $table->unsignedInteger('total_unanswered')
                  ->default(0);

            /*
            |--------------------------------------------------------------------------
            | EXAM SESSION
            |--------------------------------------------------------------------------
            */

            $table->timestamp('started_at')
                  ->nullable();

            $table->timestamp('submitted_at')
                  ->nullable();

            $table->unsignedInteger('duration_seconds')
                  ->default(0);

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            $table->string('status',20)
                  ->default('IN_PROGRESS');

            /*
            |--------------------------------------------------------------------------
            | TEACHER FEEDBACK
            |--------------------------------------------------------------------------
            */

            $table->text('feedback')
                  ->nullable();

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMP
            |--------------------------------------------------------------------------
            */

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | FOREIGN KEY
            |--------------------------------------------------------------------------
            */

            $table->foreign(
                'exam_id',
                'fk_exam_results_exam'
            )
                ->references('id')
                ->on('exam.exams')
                ->cascadeOnDelete();

            $table->foreign(
                'student_id',
                'fk_exam_results_student'
            )
                ->references('id')
                ->on('master.students')
                ->restrictOnDelete();

            /*
            |--------------------------------------------------------------------------
            | INDEX
            |--------------------------------------------------------------------------
            */

            $table->index(
                'exam_id',
                'idx_exam_results_exam'
            );

            $table->index(
                'student_id',
                'idx_exam_results_student'
            );

            $table->index(
                'status',
                'idx_exam_results_status'
            );

            $table->index(
                'submitted_at',
                'idx_exam_results_submitted'
            );

            /*
            |--------------------------------------------------------------------------
            | COMPOSITE INDEX
            |--------------------------------------------------------------------------
            */

            $table->index(
                [
                    'exam_id',
                    'student_id'
                ],
                'idx_exam_results_exam_student'
            );

            /*
            |--------------------------------------------------------------------------
            | UNIQUE
            |--------------------------------------------------------------------------
            | Satu siswa hanya boleh memiliki satu hasil
            | untuk satu exam.
            |--------------------------------------------------------------------------
            */

            $table->unique(
                [
                    'exam_id',
                    'student_id'
                ],
                'uq_exam_results_exam_student'
            );

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {

        Schema::table('exam.exam_results', function (Blueprint $table) {

            $table->dropForeign(
                'fk_exam_results_exam'
            );

            $table->dropForeign(
                'fk_exam_results_student'
            );

            $table->dropUnique(
                'uq_exam_results_exam_student'
            );

            // Index di schema exam dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS exam.idx_exam_results_exam');

            // Index di schema exam dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS exam.idx_exam_results_student');

            // Index di schema exam dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS exam.idx_exam_results_status');

            // Index di schema exam dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS exam.idx_exam_results_submitted');

            // Index di schema exam dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS exam.idx_exam_results_exam_student');

        });

        Schema::dropIfExists('exam.exam_results');
    }
};