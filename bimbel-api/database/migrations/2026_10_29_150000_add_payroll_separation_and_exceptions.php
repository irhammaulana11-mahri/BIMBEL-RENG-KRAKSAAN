<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Pemisahan tugas payroll & kontrol operator tunggal (D-03, D-11), pengecualian sesi tertunda (D-05).
     *
     * payrolls           : penyusun terakhir (generated_by/at) & tanda persetujuan atas susunan sendiri
     * payroll_transfers  : bukti transfer, tanda self-approved, konfirmasi terima oleh tentor
     * payroll_exceptions : absensi HADIR dari periode lalu yang belum dibayar, ditinjau sebelum masuk payroll
     * payroll_details    : satu absensi tentor hanya boleh dibayar sekali di seluruh payroll
     */
    public function up(): void
    {
        Schema::table('finance.payrolls', function (Blueprint $table) {
            $table->uuid('generated_by')->nullable();
            $table->timestamp('generated_at')->nullable();
            $table->text('approval_note')->nullable();
            $table->boolean('self_approved')->default(false);
        });
        // Data lama: penyusun terakhir = pembuat
        DB::statement('UPDATE finance.payrolls SET generated_by = created_by, generated_at = created_at WHERE generated_by IS NULL');

        Schema::table('finance.payroll_transfers', function (Blueprint $table) {
            $table->text('proof_path')->nullable();
            $table->text('approval_note')->nullable();
            $table->boolean('self_approved')->default(false);
            $table->string('receipt_status', 20)->nullable();
            $table->text('receipt_note')->nullable();
            $table->timestamp('receipt_at')->nullable();
        });
        DB::statement("ALTER TABLE finance.payroll_transfers ADD CONSTRAINT chk_payroll_transfers_receipt CHECK (receipt_status IS NULL OR receipt_status IN ('RECEIVED','DISPUTED'))");

        Schema::create('finance.payroll_exceptions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tentor_attendance_id')->unique('uq_payroll_exceptions_attendance');
            $table->uuid('session_id');
            $table->uuid('tentor_id');
            $table->smallInteger('origin_year');
            $table->smallInteger('origin_month');
            $table->jsonb('checks')->nullable();
            $table->string('status', 20)->default('OPEN');
            $table->uuid('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('note')->nullable();
            $table->boolean('self_approved')->default(false);
            $table->uuid('target_payroll_id')->nullable();
            $table->timestamps();

            $table->foreign('tentor_attendance_id', 'fk_payroll_exceptions_attendance')->references('id')->on('academic.tentor_attendances')->restrictOnDelete();
            $table->foreign('session_id', 'fk_payroll_exceptions_session')->references('id')->on('academic.schedule_sessions')->restrictOnDelete();
            $table->foreign('tentor_id', 'fk_payroll_exceptions_tentor')->references('id')->on('master.tentors')->restrictOnDelete();
            $table->foreign('target_payroll_id', 'fk_payroll_exceptions_payroll')->references('id')->on('finance.payrolls')->nullOnDelete();
            $table->index('status', 'payroll_exceptions_status_index');
        });
        DB::statement("ALTER TABLE finance.payroll_exceptions ADD CONSTRAINT chk_payroll_exceptions_status CHECK (status IN ('OPEN','APPROVED','REJECTED'))");

        DB::statement('CREATE UNIQUE INDEX uq_payroll_details_attendance_once ON finance.payroll_details (tentor_attendance_id) WHERE tentor_attendance_id IS NOT NULL');
    }

    public function down(): void
    {
        DB::statement('DROP INDEX IF EXISTS finance.uq_payroll_details_attendance_once');
        Schema::dropIfExists('finance.payroll_exceptions');

        DB::statement('ALTER TABLE finance.payroll_transfers DROP CONSTRAINT IF EXISTS chk_payroll_transfers_receipt');
        Schema::table('finance.payroll_transfers', function (Blueprint $table) {
            $table->dropColumn(['proof_path', 'approval_note', 'self_approved', 'receipt_status', 'receipt_note', 'receipt_at']);
        });
        Schema::table('finance.payrolls', function (Blueprint $table) {
            $table->dropColumn(['generated_by', 'generated_at', 'approval_note', 'self_approved']);
        });
    }
};
