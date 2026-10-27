<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('academic.classes', function (Blueprint $table) {

            $table->uuid('education_level_id')
                ->after('package_id')
                ->nullable();

            $table->foreign(
                'education_level_id',
                'fk_classes_education_level'
            )
                ->references('id')
                ->on('master.education_levels')
                ->restrictOnDelete();


        });
    }

    public function down(): void
    {
        Schema::table('academic.classes', function (Blueprint $table) {

            $table->dropForeign(
                'fk_classes_education_level'
            );

            // Index di schema academic dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS academic.idx_classes_education_level');

            $table->dropColumn(
                'education_level_id'
            );

        });
    }
};