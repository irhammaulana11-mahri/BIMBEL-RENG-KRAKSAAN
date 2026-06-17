<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('website.company_profiles', function (Blueprint $table) {

            $table->uuid('id')->primary();

            $table->string('name');
            $table->string('tagline')->nullable();

            $table->text('description')->nullable();

            $table->text('vision')->nullable();
            $table->text('mission')->nullable();

            $table->text('address')->nullable();

            $table->string('phone')->nullable();
            $table->string('whatsapp')->nullable();

            $table->string('email')->nullable();
            $table->string('website')->nullable();

            $table->string('logo')->nullable();
            $table->string('favicon')->nullable();

            $table->longText('google_maps_embed')->nullable();

            $table->string('facebook_url')->nullable();
            $table->string('instagram_url')->nullable();
            $table->string('youtube_url')->nullable();
            $table->string('tiktok_url')->nullable();

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('company_profiles');
    }
};
