<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Koreksi absensi siswa yang sudah terkunci (D-01) dan dampak keuangannya, tanpa mengubah
     * tagihan/payroll yang sudah terbit:
     *
     * attendance_corrections : pengajuan & persetujuan koreksi, dengan dampak keuangan yang dihitung
     * invoices               : invoice_type REGULAR/ADJUSTMENT; tagihan penyesuaian (kurang tagih) tanpa
     *                          periode bulan, merujuk tagihan asli, sehingga indeks unik per periode tetap
     * credit_notes           : saldo kredit siswa (lebih tagih) + credit_applications ke tagihan
     * refunds                : pengembalian dana ke orang tua (lebih tagih yang sudah dibayar)
     * payroll_adjustments    : penambah/pengurang honor payroll berikutnya, atau permintaan pengembalian
     */
    public function up(): void
    {
        Schema::create('academic.attendance_corrections', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('session_id');
            $table->uuid('student_id');
            $table->uuid('student_attendance_id')->nullable();
            $table->string('old_status', 20);
            $table->string('new_status', 20);
            $table->text('reason');
            $table->text('parent_request_note')->nullable();
            $table->string('status', 20)->default('PENDING');
            $table->uuid('requested_by')->nullable();
            $table->timestamp('requested_at');
            $table->uuid('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('review_note')->nullable();
            $table->boolean('self_approved')->default(false);
            $table->jsonb('financial_effect')->nullable();
            $table->string('billing_resolution', 20)->nullable();
            $table->string('payroll_resolution', 20)->nullable();
            $table->timestamps();

            $table->foreign('session_id', 'fk_att_corrections_session')->references('id')->on('academic.schedule_sessions')->restrictOnDelete();
            $table->foreign('student_id', 'fk_att_corrections_student')->references('id')->on('master.students')->restrictOnDelete();
            $table->index('status', 'att_corrections_status_index');
        });
        DB::statement("ALTER TABLE academic.attendance_corrections ADD CONSTRAINT chk_att_corrections_status CHECK (status IN ('PENDING','APPROVED','REJECTED'))");
        DB::statement("ALTER TABLE academic.attendance_corrections ADD CONSTRAINT chk_att_corrections_billing CHECK (billing_resolution IS NULL OR billing_resolution IN ('REFUND','CREDIT'))");
        DB::statement("ALTER TABLE academic.attendance_corrections ADD CONSTRAINT chk_att_corrections_payroll CHECK (payroll_resolution IS NULL OR payroll_resolution IN ('DEDUCT','REFUND_REQUEST'))");
        DB::statement("CREATE UNIQUE INDEX uq_att_corrections_pending ON academic.attendance_corrections (session_id, student_id) WHERE status = 'PENDING'");

        Schema::table('finance.invoices', function (Blueprint $table) {
            $table->string('invoice_type', 20)->default('REGULAR');
            $table->uuid('adjusts_invoice_id')->nullable();
            $table->uuid('correction_id')->nullable();
            $table->foreign('adjusts_invoice_id', 'fk_invoices_adjusts')->references('id')->on('finance.invoices')->restrictOnDelete();
        });
        DB::statement("ALTER TABLE finance.invoices ADD CONSTRAINT chk_invoices_type CHECK (invoice_type IN ('REGULAR','ADJUSTMENT'))");

        Schema::create('finance.credit_notes', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('student_id');
            $table->uuid('source_invoice_id');
            $table->uuid('correction_id')->nullable();
            $table->decimal('amount', 15, 2);
            $table->decimal('remaining_amount', 15, 2);
            $table->text('note')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();
            $table->foreign('student_id', 'fk_credit_notes_student')->references('id')->on('master.students')->restrictOnDelete();
            $table->foreign('source_invoice_id', 'fk_credit_notes_invoice')->references('id')->on('finance.invoices')->restrictOnDelete();
        });
        DB::statement('ALTER TABLE finance.credit_notes ADD CONSTRAINT chk_credit_notes_amount CHECK (amount > 0 AND remaining_amount >= 0 AND remaining_amount <= amount)');

        Schema::create('finance.credit_applications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('credit_note_id');
            $table->uuid('invoice_id');
            $table->decimal('amount', 15, 2);
            $table->uuid('created_by')->nullable();
            $table->timestamps();
            $table->foreign('credit_note_id', 'fk_credit_applications_credit')->references('id')->on('finance.credit_notes')->restrictOnDelete();
            $table->foreign('invoice_id', 'fk_credit_applications_invoice')->references('id')->on('finance.invoices')->restrictOnDelete();
        });
        DB::statement('ALTER TABLE finance.credit_applications ADD CONSTRAINT chk_credit_applications_amount CHECK (amount > 0)');

        Schema::create('finance.refunds', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('student_id');
            $table->uuid('invoice_id');
            $table->uuid('correction_id')->nullable();
            $table->decimal('amount', 15, 2);
            $table->string('method', 20);
            $table->string('reference_no', 100)->nullable();
            $table->text('proof_path');
            $table->uuid('paid_by')->nullable();
            $table->timestamp('paid_at');
            $table->text('note')->nullable();
            $table->timestamps();
            $table->foreign('student_id', 'fk_refunds_student')->references('id')->on('master.students')->restrictOnDelete();
            $table->foreign('invoice_id', 'fk_refunds_invoice')->references('id')->on('finance.invoices')->restrictOnDelete();
        });
        DB::statement("ALTER TABLE finance.refunds ADD CONSTRAINT chk_refunds CHECK (amount > 0 AND method IN ('CASH','TRANSFER'))");

        Schema::create('finance.payroll_adjustments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tentor_id');
            $table->uuid('correction_id')->nullable();
            $table->uuid('source_payroll_id')->nullable();
            $table->string('kind', 20);
            $table->decimal('amount', 15, 2);
            $table->decimal('remaining_amount', 15, 2);
            $table->string('status', 20)->default('OPEN');
            $table->text('note')->nullable();
            $table->uuid('settled_by')->nullable();
            $table->timestamp('settled_at')->nullable();
            $table->string('settle_reference', 100)->nullable();
            $table->timestamps();
            $table->foreign('tentor_id', 'fk_payroll_adjustments_tentor')->references('id')->on('master.tentors')->restrictOnDelete();
            $table->foreign('source_payroll_id', 'fk_payroll_adjustments_payroll')->references('id')->on('finance.payrolls')->restrictOnDelete();
            $table->index(['tentor_id', 'status'], 'payroll_adjustments_tentor_status_index');
        });
        DB::statement("ALTER TABLE finance.payroll_adjustments ADD CONSTRAINT chk_payroll_adjustments CHECK (kind IN ('ADDITION','DEDUCTION','RECOVERY') AND status IN ('OPEN','APPLIED','SETTLED') AND amount > 0 AND remaining_amount >= 0 AND remaining_amount <= amount)");

        Schema::table('finance.payroll_details', function (Blueprint $table) {
            $table->uuid('adjustment_id')->nullable();
            $table->foreign('adjustment_id', 'fk_payroll_details_adjustment')->references('id')->on('finance.payroll_adjustments')->restrictOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('finance.payroll_details', function (Blueprint $table) {
            $table->dropForeign('fk_payroll_details_adjustment');
            $table->dropColumn('adjustment_id');
        });
        Schema::dropIfExists('finance.payroll_adjustments');
        Schema::dropIfExists('finance.refunds');
        Schema::dropIfExists('finance.credit_applications');
        Schema::dropIfExists('finance.credit_notes');

        DB::statement('ALTER TABLE finance.invoices DROP CONSTRAINT IF EXISTS chk_invoices_type');
        Schema::table('finance.invoices', function (Blueprint $table) {
            $table->dropForeign('fk_invoices_adjusts');
            $table->dropColumn(['invoice_type', 'adjusts_invoice_id', 'correction_id']);
        });

        Schema::dropIfExists('academic.attendance_corrections');
    }
};
