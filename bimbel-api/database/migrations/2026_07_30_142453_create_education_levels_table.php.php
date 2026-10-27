<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create Master Education Levels Table
     */
    public function up(): void
    {
        Schema::create('master.education_levels', function (Blueprint $table) {

            /*
            |--------------------------------------------------------------------------
            | PRIMARY KEY
            |--------------------------------------------------------------------------
            */

            $table->uuid('id')->primary();

            /*
            |--------------------------------------------------------------------------
            | EDUCATION LEVEL
            |--------------------------------------------------------------------------
            */

            $table->string('level_code',20);

            $table->string('education_level',20);

            $table->unsignedSmallInteger('grade_level');

            $table->string('display_name',100);

            /*
            |--------------------------------------------------------------------------
            | DISPLAY
            |--------------------------------------------------------------------------
            */

            $table->unsignedInteger('sort_order')
                  ->default(1);

            $table->boolean('is_active')
                  ->default(true);

            /*
            |--------------------------------------------------------------------------
            | INFORMATION
            |--------------------------------------------------------------------------
            */

            $table->text('description')
                  ->nullable();

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | UNIQUE
            |--------------------------------------------------------------------------
            */

            $table->unique(
                'level_code',
                'uq_education_levels_code'
            );

            $table->unique(
                [
                    'education_level',
                    'grade_level'
                ],
                'uq_education_levels_level_grade'
            );

            /*
            |--------------------------------------------------------------------------
            | INDEX
            |--------------------------------------------------------------------------
            */

            $table->index(
                'education_level',
                'idx_education_levels_level'
            );

            $table->index(
                'grade_level',
                'idx_education_levels_grade'
            );

            $table->index(
                'is_active',
                'idx_education_levels_active'
            );

            $table->index(
                'sort_order',
                'idx_education_levels_sort'
            );

            $table->index(
                [
                    'education_level',
                    'grade_level'
                ],
                'idx_education_levels_level_grade'
            );

        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {

        Schema::table('master.education_levels', function (Blueprint $table) {

            $table->dropUnique(
                'uq_education_levels_code'
            );

            $table->dropUnique(
                'uq_education_levels_level_grade'
            );

            // Index di schema master dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS master.idx_education_levels_level');

            // Index di schema master dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS master.idx_education_levels_grade');

            // Index di schema master dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS master.idx_education_levels_active');

            // Index di schema master dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS master.idx_education_levels_sort');

            // Index di schema master dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS master.idx_education_levels_level_grade');

        });

        Schema::dropIfExists('master.education_levels');
    }
};