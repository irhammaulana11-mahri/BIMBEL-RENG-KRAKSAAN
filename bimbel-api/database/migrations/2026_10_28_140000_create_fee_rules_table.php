<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Rule Engine keuangan: absensi hanya fakta, tagihan & honor dihitung dari aturan tarif Admin.
     *
     * fee_rules        : aturan BILLING (tagihan wali) dan PAYROLL (honor tentor), terpisah
     * invoice_items    : salinan aturan/metode per baris + kuantitas desimal (per jam)
     * payroll_details  : salinan aturan/metode + kuantitas; baris bulanan tanpa sesi
     * invoices.package : boleh kosong (tagihan dari aturan jenis kelas tanpa paket)
     */
    public function up(): void
    {
        Schema::create('finance.fee_rules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('rule_type', 20);
            $table->string('name', 150);

            // Cakupan opsional; kosong = berlaku untuk semua
            $table->string('class_type', 30)->nullable();
            $table->uuid('package_id')->nullable();
            $table->string('education_level', 30)->nullable();
            $table->uuid('tentor_id')->nullable();

            $table->string('method', 20);
            $table->decimal('amount', 15, 2);
            // Status kehadiran siswa yang dihitung; kosong = semua status
            $table->json('counted_statuses')->nullable();

            $table->date('effective_from');
            $table->date('effective_to')->nullable();
            $table->boolean('is_active')->default(true);
            $table->text('note')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('package_id')->references('id')->on('website.packages')->nullOnDelete();
            $table->foreign('tentor_id')->references('id')->on('master.tentors')->cascadeOnDelete();
            $table->index(['rule_type', 'is_active'], 'idx_fee_rules_type_active');
        });

        DB::statement("
            ALTER TABLE finance.fee_rules
            ADD CONSTRAINT fee_rules_type_check CHECK (rule_type IN ('BILLING', 'PAYROLL'))
        ");
        DB::statement("
            ALTER TABLE finance.fee_rules
            ADD CONSTRAINT fee_rules_method_check CHECK (method IN ('PER_STUDENT', 'PER_MEETING', 'PER_HOUR', 'MONTHLY'))
        ");

        DB::statement('ALTER TABLE finance.invoices ALTER COLUMN package_id DROP NOT NULL');
        DB::statement('ALTER TABLE finance.invoice_items ALTER COLUMN quantity TYPE numeric(10,2)');
        Schema::table('finance.invoice_items', function (Blueprint $table) {
            $table->uuid('fee_rule_id')->nullable();
            $table->string('calc_method', 20)->nullable();
        });

        DB::statement('ALTER TABLE finance.payroll_details ALTER COLUMN tentor_attendance_id DROP NOT NULL');
        DB::statement('ALTER TABLE finance.payroll_details ALTER COLUMN session_id DROP NOT NULL');
        Schema::table('finance.payroll_details', function (Blueprint $table) {
            $table->uuid('fee_rule_id')->nullable();
            $table->string('calc_method', 20)->nullable();
            $table->decimal('quantity', 10, 2)->default(1);
            $table->decimal('unit_amount', 15, 2)->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('finance.payroll_details', function (Blueprint $table) {
            $table->dropColumn(['fee_rule_id', 'calc_method', 'quantity', 'unit_amount']);
        });
        Schema::table('finance.invoice_items', function (Blueprint $table) {
            $table->dropColumn(['fee_rule_id', 'calc_method']);
        });
        DB::statement('ALTER TABLE finance.invoice_items ALTER COLUMN quantity TYPE integer USING round(quantity)');
        Schema::dropIfExists('finance.fee_rules');
    }
};
