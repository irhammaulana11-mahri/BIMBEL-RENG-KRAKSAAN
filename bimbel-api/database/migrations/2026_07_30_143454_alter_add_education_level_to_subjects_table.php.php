<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('master.subjects', function (Blueprint $table) {

            /*
            |--------------------------------------------------------------------------
            | EDUCATION LEVEL
            |--------------------------------------------------------------------------
            */

            $table->uuid('education_level_id')
                ->after('subject_code')
                ->nullable();

            /*
            |--------------------------------------------------------------------------
            | FOREIGN KEY
            |--------------------------------------------------------------------------
            */

            $table->foreign(
                'education_level_id',
                'fk_subjects_education_level'
            )
                ->references('id')
                ->on('master.education_levels')
                ->restrictOnDelete();

            /*
            |--------------------------------------------------------------------------
            | INDEX
            |--------------------------------------------------------------------------
            */

            $table->index(
                'education_level_id',
                'idx_subjects_education_level'
            );

        });
    }

    public function down(): void
    {
        Schema::table('master.subjects', function (Blueprint $table) {

            $table->dropForeign(
                'fk_subjects_education_level'
            );

            // Index di schema master dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS master.idx_subjects_education_level');

            $table->dropColumn(
                'education_level_id'
            );

        });
    }
};