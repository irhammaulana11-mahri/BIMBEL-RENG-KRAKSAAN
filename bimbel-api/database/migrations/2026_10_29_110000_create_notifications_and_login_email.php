<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * notifications                         : notifikasi dalam aplikasi untuk semua role (web & Android)
     * student_registration_requests.login_email : email login anak yang diusulkan orang tua (opsional)
     */
    public function up(): void
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('type');
            // ID pengguna berupa UUID (master.users)
            $table->uuidMorphs('notifiable');
            $table->json('data');
            $table->timestamp('read_at')->nullable();
            $table->timestamps();
        });

        Schema::table('master.student_registration_requests', function (Blueprint $table) {
            $table->string('login_email', 100)->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('master.student_registration_requests', function (Blueprint $table) {
            $table->dropColumn('login_email');
        });
        Schema::dropIfExists('notifications');
    }
};
