<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create Exam Answers Table
     */
    public function up(): void
    {
        Schema::create('exam.exam_answers', function (Blueprint $table) {

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

            $table->uuid('exam_result_id');

            $table->uuid('question_id');

            /*
            |--------------------------------------------------------------------------
            | STUDENT ANSWER
            |--------------------------------------------------------------------------
            */

            $table->text('answer')->nullable();

            /*
            |--------------------------------------------------------------------------
            | GRADING
            |--------------------------------------------------------------------------
            */

            $table->boolean('is_correct')
                  ->nullable();

            $table->decimal('score',5,2)
                  ->default(0);

            /*
            |--------------------------------------------------------------------------
            | FEEDBACK
            |--------------------------------------------------------------------------
            */

            $table->text('teacher_feedback')
                  ->nullable();

            $table->text('ai_feedback')
                  ->nullable();

            $table->timestamp('graded_at')
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
                'exam_result_id',
                'fk_exam_answers_result'
            )
                ->references('id')
                ->on('exam.exam_results')
                ->cascadeOnDelete();

            $table->foreign(
                'question_id',
                'fk_exam_answers_question'
            )
                ->references('id')
                ->on('exam.questions')
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | INDEX
            |--------------------------------------------------------------------------
            */

            $table->index(
                'exam_result_id',
                'idx_exam_answers_result'
            );

            $table->index(
                'question_id',
                'idx_exam_answers_question'
            );

            $table->index(
                'is_correct',
                'idx_exam_answers_correct'
            );

            $table->index(
                'graded_at',
                'idx_exam_answers_graded'
            );

            /*
            |--------------------------------------------------------------------------
            | COMPOSITE INDEX
            |--------------------------------------------------------------------------
            */

            $table->index(
                [
                    'exam_result_id',
                    'question_id'
                ],
                'idx_exam_answers_result_question'
            );

            /*
            |--------------------------------------------------------------------------
            | UNIQUE
            |--------------------------------------------------------------------------
            | Satu hasil ujian hanya memiliki satu jawaban
            | untuk setiap soal.
            |--------------------------------------------------------------------------
            */

            $table->unique(
                [
                    'exam_result_id',
                    'question_id'
                ],
                'uq_exam_answers_result_question'
            );

        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {

        Schema::table('exam.exam_answers', function (Blueprint $table) {

            $table->dropForeign(
                'fk_exam_answers_result'
            );

            $table->dropForeign(
                'fk_exam_answers_question'
            );

            $table->dropUnique(
                'uq_exam_answers_result_question'
            );

            // Index di schema exam dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS exam.idx_exam_answers_result');

            // Index di schema exam dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS exam.idx_exam_answers_question');

            // Index di schema exam dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS exam.idx_exam_answers_correct');

            // Index di schema exam dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS exam.idx_exam_answers_graded');

            // Index di schema exam dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS exam.idx_exam_answers_result_question');

        });

        Schema::dropIfExists('exam.exam_answers');
    }
};