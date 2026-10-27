<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pengajuan yang memerlukan persetujuan Admin.
     *
     * reschedule_requests          : usulan pindah jadwal sesi dari orang tua atau tentor
     * student_registration_requests: pendaftaran anak baru oleh orang tua
     * Status: PENDING -> APPROVED / REJECTED, atau CANCELLED oleh pengaju
     */
    public function up(): void
    {
        Schema::create('academic.reschedule_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('session_id');
            $table->uuid('requested_by');
            $table->string('requester_type', 20);
            $table->uuid('student_id')->nullable();
            $table->date('original_date');
            $table->time('original_start_time');
            $table->date('proposed_date');
            $table->time('proposed_start_time');
            $table->time('proposed_end_time');
            $table->text('reason');
            $table->string('status', 20)->default('PENDING');
            $table->text('review_note')->nullable();
            $table->uuid('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->foreign('session_id')->references('id')->on('academic.schedule_sessions')->cascadeOnDelete();
            $table->foreign('requested_by')->references('id')->on('master.users')->cascadeOnDelete();
            $table->foreign('student_id')->references('id')->on('master.students')->nullOnDelete();
            $table->index(['status', 'created_at'], 'idx_reschedule_requests_status');
        });

        DB::statement("
            ALTER TABLE academic.reschedule_requests
            ADD CONSTRAINT reschedule_requests_status_check
            CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'))
        ");

        DB::statement("
            ALTER TABLE academic.reschedule_requests
            ADD CONSTRAINT reschedule_requests_requester_check
            CHECK (requester_type IN ('PARENT', 'TENTOR'))
        ");

        // Satu pengajuan aktif per sesi per pengaju
        DB::statement("
            CREATE UNIQUE INDEX uq_reschedule_requests_pending
            ON academic.reschedule_requests (session_id, requested_by)
            WHERE status = 'PENDING'
        ");

        Schema::create('master.student_registration_requests', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('parent_id');
            $table->string('full_name', 150);
            $table->string('gender', 10)->nullable();
            $table->date('birth_date')->nullable();
            $table->string('school_name', 150)->nullable();
            $table->uuid('education_level_id')->nullable();
            $table->uuid('package_id')->nullable();
            $table->text('note')->nullable();
            $table->string('status', 20)->default('PENDING');
            $table->text('review_note')->nullable();
            $table->uuid('student_id')->nullable();
            $table->uuid('class_id')->nullable();
            $table->uuid('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->foreign('parent_id')->references('id')->on('master.parents')->cascadeOnDelete();
            $table->foreign('education_level_id')->references('id')->on('master.education_levels')->nullOnDelete();
            $table->foreign('package_id')->references('id')->on('website.packages')->nullOnDelete();
            $table->foreign('student_id')->references('id')->on('master.students')->nullOnDelete();
            $table->foreign('class_id')->references('id')->on('academic.classes')->nullOnDelete();
            $table->index(['status', 'created_at'], 'idx_student_registration_requests_status');
        });

        DB::statement("
            ALTER TABLE master.student_registration_requests
            ADD CONSTRAINT student_registration_requests_status_check
            CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'))
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('master.student_registration_requests');
        Schema::dropIfExists('academic.reschedule_requests');
    }
};
