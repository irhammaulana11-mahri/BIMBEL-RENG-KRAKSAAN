<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create Exams Table
     *
     * Tabel exam.exams sebelumnya dibuat langsung di database tanpa migration.
     * Migration ini memastikan instalasi baru memiliki tabel induk sebelum
     * exam.questions dan exam.exam_results dibuat. Dilewati jika tabel sudah ada.
     */
    public function up(): void
    {
        DB::statement('CREATE SCHEMA IF NOT EXISTS exam');

        if (Schema::hasTable('exam.exams')) {
            return;
        }

        Schema::create('exam.exams', function (Blueprint $table) {

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

            $table->uuid('subject_id');

            $table->uuid('tutor_id');

            /*
            |--------------------------------------------------------------------------
            | EXAM
            |--------------------------------------------------------------------------
            */

            $table->string('title', 200);

            $table->date('exam_date')->nullable();

            $table->integer('duration')->nullable();

            $table->integer('total_score')->nullable()->default(100);

            $table->string('assessment_type', 20)->nullable();

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMP
            |--------------------------------------------------------------------------
            */

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | FOREIGN KEY CONSTRAINT
            |--------------------------------------------------------------------------
            */

            $table->foreign('subject_id', 'fk_exam_subject')
                ->references('id')
                ->on('master.subjects');

            $table->foreign('tutor_id', 'fk_exam_tutor')
                ->references('id')
                ->on('master.tentors');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('exam.exams');
    }
};
