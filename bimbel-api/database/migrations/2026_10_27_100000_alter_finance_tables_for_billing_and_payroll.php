<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Keuangan bimbel.
     *
     * Tagihan siswa  : harga paket kelas per bulan (snapshot di invoice_items)
     * Pembayaran     : upload bukti oleh orang tua (PENDING -> CONFIRMED/REJECTED)
     *                  atau dicatat langsung Admin (CONFIRMED)
     * Honor tentor   : tarif per sesi tentor x sesi HADIR; dibayar per tentor (payroll_transfers)
     * Pengeluaran    : biaya operasional untuk laporan arus kas
     */
    public function up(): void
    {
        /*
        |--------------------------------------------------------------------------
        | TARIF TENTOR
        |--------------------------------------------------------------------------
        */

        Schema::table('master.tentors', function (Blueprint $table) {
            $table->decimal('rate_per_session', 15, 2)->default(0);
        });

        /*
        |--------------------------------------------------------------------------
        | INVOICES
        |--------------------------------------------------------------------------
        | Status: UNPAID -> PARTIAL -> PAID, atau CANCELLED
        */

        DB::statement("UPDATE finance.invoices SET status = 'UNPAID' WHERE status = 'DRAFT'");
        DB::statement("ALTER TABLE finance.invoices ALTER COLUMN status SET DEFAULT 'UNPAID'");

        Schema::table('finance.invoices', function (Blueprint $table) {
            $table->smallInteger('period_month')->nullable();
            $table->smallInteger('period_year')->nullable();
            $table->text('cancel_reason')->nullable();
            $table->uuid('created_by')->nullable();
        });

        DB::statement("
            ALTER TABLE finance.invoices
            ADD CONSTRAINT invoices_status_check
            CHECK (status IN ('UNPAID', 'PARTIAL', 'PAID', 'CANCELLED'))
        ");

        DB::statement("
            ALTER TABLE finance.invoices
            ADD CONSTRAINT invoices_amount_check
            CHECK (total_amount >= 0 AND paid_amount >= 0 AND remaining_amount >= 0)
        ");

        // Satu tagihan bulanan aktif per siswa per kelas per periode
        DB::statement("
            CREATE UNIQUE INDEX uq_invoices_student_class_period
            ON finance.invoices (student_id, class_id, period_year, period_month)
            WHERE period_month IS NOT NULL AND status <> 'CANCELLED'
        ");

        DB::statement('CREATE INDEX idx_invoices_billing_period ON finance.invoices (period_year, period_month)');

        /*
        |--------------------------------------------------------------------------
        | PAYMENTS
        |--------------------------------------------------------------------------
        | Status: PENDING (menunggu verifikasi) -> CONFIRMED / REJECTED
        */

        Schema::table('finance.payments', function (Blueprint $table) {
            $table->uuid('submitted_by')->nullable();
            $table->text('reject_reason')->nullable();
        });

        DB::statement("
            ALTER TABLE finance.payments
            ADD CONSTRAINT payments_status_check
            CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED'))
        ");

        DB::statement("
            ALTER TABLE finance.payments
            ADD CONSTRAINT payments_method_check
            CHECK (payment_method IN ('CASH', 'TRANSFER'))
        ");

        /*
        |--------------------------------------------------------------------------
        | PAYROLLS
        |--------------------------------------------------------------------------
        | Status: DRAFT -> APPROVED -> PAID (semua tentor sudah ditransfer)
        */

        DB::statement("
            ALTER TABLE finance.payrolls
            ADD CONSTRAINT payrolls_status_check
            CHECK (status IN ('DRAFT', 'APPROVED', 'PAID'))
        ");

        Schema::table('finance.payrolls', function (Blueprint $table) {
            $table->uuid('created_by')->nullable();
            $table->uuid('approved_by')->nullable();
        });

        Schema::create('finance.payroll_transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('payroll_id');
            $table->uuid('tentor_id');
            $table->decimal('amount', 15, 2)->default(0);
            $table->date('transfer_date');
            $table->string('source_account', 100)->nullable();
            $table->string('reference_no', 100)->nullable();
            $table->text('note')->nullable();
            $table->uuid('paid_by')->nullable();
            $table->timestamps();

            $table->foreign('payroll_id', 'fk_payroll_transfers_payroll')
                ->references('id')
                ->on('finance.payrolls')
                ->cascadeOnDelete();

            $table->foreign('tentor_id', 'fk_payroll_transfers_tentor')
                ->references('id')
                ->on('master.tentors')
                ->restrictOnDelete();

            $table->unique(['payroll_id', 'tentor_id'], 'uq_payroll_transfers_payroll_tentor');
            $table->index('transfer_date', 'idx_payroll_transfers_date');
        });

        /*
        |--------------------------------------------------------------------------
        | OPERATIONAL EXPENSES (Cashflow)
        |--------------------------------------------------------------------------
        */

        Schema::create('finance.operational_expenses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->date('expense_date');
            $table->string('category', 50);
            $table->string('title', 200);
            $table->decimal('amount', 15, 2);
            $table->string('payment_method', 30)->default('CASH');
            $table->text('note')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->index('expense_date', 'idx_operational_expenses_date');
            $table->index('category', 'idx_operational_expenses_category');
        });

        DB::statement("
            ALTER TABLE finance.operational_expenses
            ADD CONSTRAINT operational_expenses_amount_check
            CHECK (amount > 0)
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('finance.operational_expenses');
        Schema::dropIfExists('finance.payroll_transfers');

        Schema::table('finance.payrolls', function (Blueprint $table) {
            $table->dropColumn(['created_by', 'approved_by']);
        });
        DB::statement('ALTER TABLE finance.payrolls DROP CONSTRAINT IF EXISTS payrolls_status_check');

        DB::statement('ALTER TABLE finance.payments DROP CONSTRAINT IF EXISTS payments_method_check');
        DB::statement('ALTER TABLE finance.payments DROP CONSTRAINT IF EXISTS payments_status_check');
        Schema::table('finance.payments', function (Blueprint $table) {
            $table->dropColumn(['submitted_by', 'reject_reason']);
        });

        // Index di schema finance (di luar search_path) di-drop dengan nama lengkap
        DB::statement('DROP INDEX IF EXISTS finance.idx_invoices_billing_period');
        DB::statement('DROP INDEX IF EXISTS finance.uq_invoices_student_class_period');
        DB::statement('ALTER TABLE finance.invoices DROP CONSTRAINT IF EXISTS invoices_amount_check');
        DB::statement('ALTER TABLE finance.invoices DROP CONSTRAINT IF EXISTS invoices_status_check');
        Schema::table('finance.invoices', function (Blueprint $table) {
            $table->dropColumn(['period_month', 'period_year', 'cancel_reason', 'created_by']);
        });
        DB::statement("ALTER TABLE finance.invoices ALTER COLUMN status SET DEFAULT 'DRAFT'");

        Schema::table('master.tentors', function (Blueprint $table) {
            $table->dropColumn('rate_per_session');
        });
    }
};
