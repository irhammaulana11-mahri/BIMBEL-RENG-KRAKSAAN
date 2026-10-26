<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create Academic Curriculums Table
     */
    public function up(): void
    {
        Schema::create('academic.curriculums', function (Blueprint $table) {

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

            /*
            |--------------------------------------------------------------------------
            | CURRICULUM
            |--------------------------------------------------------------------------
            */

            $table->string('title',200);

            $table->text('description')->nullable();

            $table->string('education_level',20);

            $table->unsignedSmallInteger('semester')
                  ->nullable();

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
                'subject_id',
                'fk_curriculums_subject'
            )
                ->references('id')
                ->on('master.subjects')
                ->cascadeOnDelete();

            /*
            |--------------------------------------------------------------------------
            | INDEX
            |--------------------------------------------------------------------------
            */

            $table->index(
                'subject_id',
                'idx_curriculums_subject'
            );

            $table->index(
                'education_level',
                'idx_curriculums_level'
            );

            $table->index(
                'semester',
                'idx_curriculums_semester'
            );

            $table->index(
                'order_no',
                'idx_curriculums_order'
            );

            $table->index(
                'is_active',
                'idx_curriculums_active'
            );

            /*
            |--------------------------------------------------------------------------
            | COMPOSITE INDEX
            |--------------------------------------------------------------------------
            */

            $table->index(
                [
                    'subject_id',
                    'education_level'
                ],
                'idx_curriculums_subject_level'
            );

            /*
            |--------------------------------------------------------------------------
            | UNIQUE
            |--------------------------------------------------------------------------
            | Mencegah urutan bab yang sama
            | pada Subject + Level + Semester
            |--------------------------------------------------------------------------
            */

            $table->unique(
                [
                    'subject_id',
                    'education_level',
                    'semester',
                    'order_no'
                ],
                'uq_curriculums_subject_order'
            );

        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {

        Schema::table('academic.curriculums', function (Blueprint $table) {

            $table->dropForeign(
                'fk_curriculums_subject'
            );

            $table->dropUnique(
                'uq_curriculums_subject_order'
            );

            $table->dropIndex(
                'idx_curriculums_subject'
            );

            $table->dropIndex(
                'idx_curriculums_level'
            );

            $table->dropIndex(
                'idx_curriculums_semester'
            );

            $table->dropIndex(
                'idx_curriculums_order'
            );

            $table->dropIndex(
                'idx_curriculums_active'
            );

            $table->dropIndex(
                'idx_curriculums_subject_level'
            );

        });

        Schema::dropIfExists('academic.curriculums');
    }
};