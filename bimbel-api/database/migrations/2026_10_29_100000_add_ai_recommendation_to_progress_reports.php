<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Rekomendasi perkembangan anak (dibuat AI, ditinjau/diedit Admin) per rapor bulanan.
     * Ikut dibekukan ke snapshot saat rapor diterbitkan.
     */
    public function up(): void
    {
        Schema::table('academic.progress_reports', function (Blueprint $table) {
            $table->json('ai_recommendation')->nullable();
            $table->timestamp('ai_generated_at')->nullable();
            $table->boolean('ai_edited')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('academic.progress_reports', function (Blueprint $table) {
            $table->dropColumn(['ai_recommendation', 'ai_generated_at', 'ai_edited']);
        });
    }
};
