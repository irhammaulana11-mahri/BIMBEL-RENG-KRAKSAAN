<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('academic.curriculums', function (Blueprint $table) {

            $table->uuid('education_level_id')
                ->after('subject_id')
                ->nullable();

            $table->foreign(
                'education_level_id',
                'fk_curriculums_education_level'
            )
                ->references('id')
                ->on('master.education_levels')
                ->restrictOnDelete();

            $table->index(
                'education_level_id',
                'idx_curriculums_education_level'
            );

        });
    }

    public function down(): void
    {
        Schema::table('academic.curriculums', function (Blueprint $table) {

            $table->dropForeign(
                'fk_curriculums_education_level'
            );

            $table->dropIndex(
                'idx_curriculums_education_level'
            );

            $table->dropColumn(
                'education_level_id'
            );

        });
    }
};