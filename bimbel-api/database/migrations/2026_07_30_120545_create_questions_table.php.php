<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create Exam Questions Table
     */
    public function up(): void
    {
        Schema::create('exam.questions', function (Blueprint $table) {

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

            /*
            |--------------------------------------------------------------------------
            | QUESTION
            |--------------------------------------------------------------------------
            */

            $table->string('question_type',30)
                  ->default('MULTIPLE_CHOICE');

            $table->text('question');

            /*
            |--------------------------------------------------------------------------
            | MULTIPLE CHOICE OPTIONS
            |--------------------------------------------------------------------------
            */

            $table->text('option_a')->nullable();

            $table->text('option_b')->nullable();

            $table->text('option_c')->nullable();

            $table->text('option_d')->nullable();

            $table->text('option_e')->nullable();

            /*
            |--------------------------------------------------------------------------
            | ANSWER
            |--------------------------------------------------------------------------
            */

            $table->text('correct_answer')->nullable();

            $table->text('essay_answer')->nullable();

            /*
            |--------------------------------------------------------------------------
            | INFORMATION
            |--------------------------------------------------------------------------
            */

            $table->unsignedInteger('score')
                  ->default(1);

            $table->unsignedInteger('order_no')
                  ->default(1);

            $table->boolean('is_active')
                  ->default(true);

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
                'fk_questions_exam'
            )
                ->references('id')
                ->on('exam.exams')
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | INDEX
            |--------------------------------------------------------------------------
            */

            $table->index(
                'exam_id',
                'idx_questions_exam'
            );

            $table->index(
                'question_type',
                'idx_questions_type'
            );

            $table->index(
                'order_no',
                'idx_questions_order'
            );

            $table->index(
                'is_active',
                'idx_questions_active'
            );

            /*
            |--------------------------------------------------------------------------
            | COMPOSITE INDEX
            |--------------------------------------------------------------------------
            */

            $table->index(
                [
                    'exam_id',
                    'order_no'
                ],
                'idx_questions_exam_order'
            );

            /*
            |--------------------------------------------------------------------------
            | UNIQUE
            |--------------------------------------------------------------------------
            | Mencegah nomor soal ganda
            |--------------------------------------------------------------------------
            */

            $table->unique(
                [
                    'exam_id',
                    'order_no'
                ],
                'uq_questions_exam_order'
            );

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {

        Schema::table('exam.questions', function (Blueprint $table) {

            $table->dropForeign(
                'fk_questions_exam'
            );

            $table->dropUnique(
                'uq_questions_exam_order'
            );

            $table->dropIndex(
                'idx_questions_exam'
            );

            $table->dropIndex(
                'idx_questions_type'
            );

            $table->dropIndex(
                'idx_questions_order'
            );

            $table->dropIndex(
                'idx_questions_active'
            );

            $table->dropIndex(
                'idx_questions_exam_order'
            );

        });

        Schema::dropIfExists('exam.questions');
    }
};