<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create Academic Materials Table
     */
    public function up(): void
    {
        Schema::create('academic.materials', function (Blueprint $table) {

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

            $table->uuid('curriculum_id');

            $table->uuid('tentor_id');

            /*
            |--------------------------------------------------------------------------
            | MATERIAL
            |--------------------------------------------------------------------------
            */

            $table->string('title', 200);

            $table->text('description')->nullable();

            $table->string('material_type', 30)
                  ->default('DOCUMENT');

            /*
            |--------------------------------------------------------------------------
            | RESOURCE
            |--------------------------------------------------------------------------
            */

            $table->text('file_path')->nullable();

            $table->text('video_url')->nullable();

            $table->text('external_url')->nullable();

            /*
            |--------------------------------------------------------------------------
            | INFORMATION
            |--------------------------------------------------------------------------
            */

            $table->unsignedInteger('duration_minutes')
                  ->nullable();

            $table->unsignedInteger('sort_order')
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
                'curriculum_id',
                'fk_materials_curriculum'
            )
                ->references('id')
                ->on('academic.curriculums')
                ->cascadeOnDelete();

            $table->foreign(
                'tentor_id',
                'fk_materials_tentor'
            )
                ->references('id')
                ->on('master.tentors')
                ->restrictOnDelete();

            /*
            |--------------------------------------------------------------------------
            | INDEX
            |--------------------------------------------------------------------------
            */

            $table->index(
                'curriculum_id',
                'idx_materials_curriculum'
            );

            $table->index(
                'tentor_id',
                'idx_materials_tentor'
            );

            $table->index(
                'material_type',
                'idx_materials_type'
            );

            $table->index(
                'sort_order',
                'idx_materials_order'
            );

            $table->index(
                'is_active',
                'idx_materials_active'
            );

            /*
            |--------------------------------------------------------------------------
            | COMPOSITE INDEX
            |--------------------------------------------------------------------------
            */

            $table->index(
                [
                    'curriculum_id',
                    'sort_order'
                ],
                'idx_materials_curriculum_order'
            );

            /*
            |--------------------------------------------------------------------------
            | UNIQUE
            |--------------------------------------------------------------------------
            | Mencegah urutan materi yang sama
            | dalam satu Curriculum.
            |--------------------------------------------------------------------------
            */

            $table->unique(
                [
                    'curriculum_id',
                    'sort_order'
                ],
                'uq_materials_curriculum_order'
            );

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('academic.materials', function (Blueprint $table) {

            $table->dropForeign(
                'fk_materials_curriculum'
            );

            $table->dropForeign(
                'fk_materials_tentor'
            );

            $table->dropUnique(
                'uq_materials_curriculum_order'
            );

            $table->dropIndex(
                'idx_materials_curriculum'
            );

            $table->dropIndex(
                'idx_materials_tentor'
            );

            $table->dropIndex(
                'idx_materials_type'
            );

            $table->dropIndex(
                'idx_materials_order'
            );

            $table->dropIndex(
                'idx_materials_active'
            );

            $table->dropIndex(
                'idx_materials_curriculum_order'
            );

        });

        Schema::dropIfExists('academic.materials');
    }
};