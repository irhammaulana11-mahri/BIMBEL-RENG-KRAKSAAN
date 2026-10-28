<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Absensi tentor berbasis GPS.
     *
     * students.home_*              : titik rumah siswa, sasaran absen kelas PRIVATE
     * tentor_attendances.*         : koordinat & jarak saat absen masuk / pulang, plus titik sasaran yang dipakai
     * location_change_requests     : pindah lokasi les sementara per sesi (tentor / orang tua), disetujui Admin
     */
    public function up(): void
    {
        Schema::table('master.students', function (Blueprint $table) {
            $table->text('home_address')->nullable();
            $table->decimal('home_latitude', 10, 8)->nullable();
            $table->decimal('home_longitude', 11, 8)->nullable();
        });

        Schema::table('academic.tentor_attendances', function (Blueprint $table) {
            // Titik sasaran saat absen masuk (dibekukan agar riwayat tidak berubah bila lokasi diedit)
            $table->string('target_label', 200)->nullable();
            $table->decimal('target_latitude', 10, 8)->nullable();
            $table->decimal('target_longitude', 11, 8)->nullable();
            $table->unsignedInteger('target_radius_meter')->nullable();

            $table->decimal('checkin_latitude', 10, 8)->nullable();
            $table->decimal('checkin_longitude', 11, 8)->nullable();
            $table->unsignedInteger('checkin_accuracy_meter')->nullable();
            $table->unsignedInteger('checkin_distance_meter')->nullable();
            $table->boolean('checkin_outside_area')->default(false);
            $table->boolean('checkin_outside_time')->default(false);

            $table->decimal('checkout_latitude', 10, 8)->nullable();
            $table->decimal('checkout_longitude', 11, 8)->nullable();
            $table->unsignedInteger('checkout_accuracy_meter')->nullable();
            $table->unsignedInteger('checkout_distance_meter')->nullable();
            $table->boolean('checkout_outside_area')->default(false);
            $table->boolean('checkout_outside_time')->default(false);
            $table->unsignedInteger('early_leave_minutes')->default(0);

            // WEB / ANDROID / ADMIN (koreksi manual)
            $table->string('checkin_source', 20)->nullable();
        });

        Schema::create('academic.location_change_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('session_id');
            $table->uuid('requested_by');
            $table->string('requester_type', 20);
            $table->uuid('student_id')->nullable();
            $table->string('location_name', 150);
            $table->text('address');
            $table->decimal('latitude', 10, 8);
            $table->decimal('longitude', 11, 8);
            $table->text('reason');
            $table->string('status', 20)->default('PENDING');
            $table->text('review_note')->nullable();
            $table->uuid('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->foreign('session_id')->references('id')->on('academic.schedule_sessions')->cascadeOnDelete();
            $table->foreign('requested_by')->references('id')->on('master.users')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('master.students')->nullOnDelete();
            $table->index(['status', 'created_at'], 'idx_location_change_requests_status');
            $table->index('session_id', 'idx_location_change_requests_session');
        });

        DB::statement("
            ALTER TABLE academic.location_change_requests
            ADD CONSTRAINT location_change_requests_status_check
            CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'))
        ");

        DB::statement("
            ALTER TABLE academic.location_change_requests
            ADD CONSTRAINT location_change_requests_requester_check
            CHECK (requester_type IN ('PARENT', 'TENTOR'))
        ");

        // Satu pengajuan aktif per sesi per pengaju
        DB::statement("
            CREATE UNIQUE INDEX uq_location_change_requests_pending
            ON academic.location_change_requests (session_id, requested_by)
            WHERE status = 'PENDING'
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('academic.location_change_requests');

        Schema::table('academic.tentor_attendances', function (Blueprint $table) {
            $table->dropColumn([
                'target_label', 'target_latitude', 'target_longitude', 'target_radius_meter',
                'checkin_latitude', 'checkin_longitude', 'checkin_accuracy_meter', 'checkin_distance_meter',
                'checkin_outside_area', 'checkin_outside_time',
                'checkout_latitude', 'checkout_longitude', 'checkout_accuracy_meter', 'checkout_distance_meter',
                'checkout_outside_area', 'checkout_outside_time', 'early_leave_minutes',
                'checkin_source',
            ]);
        });

        Schema::table('master.students', function (Blueprint $table) {
            $table->dropColumn(['home_address', 'home_latitude', 'home_longitude']);
        });
    }
};
