<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Integritas data keuangan di level database (temuan DB-02 & nominal pembayaran):
     * - nominal pembayaran & alokasinya harus > 0
     * - fee_rule_id pada item tagihan & baris payroll harus merujuk aturan tarif yang ada (RESTRICT:
     *   aturan yang sudah dipakai tidak bisa dihapus, cukup dinonaktifkan)
     *
     * Data yang melanggar dicek lebih dulu agar migration gagal dengan pesan jelas, bukan setengah jalan.
     * FK dibuat NOT VALID lalu divalidasi terpisah agar tabel tidak terkunci lama saat validasi.
     */
    public function up(): void
    {
        $violations = [
            'payments.total_amount <= 0'           => 'SELECT count(*) AS n FROM finance.payments WHERE total_amount <= 0',
            'payment_details.amount_paid <= 0'     => 'SELECT count(*) AS n FROM finance.payment_details WHERE amount_paid <= 0',
            'invoice_items.fee_rule_id yatim'      => 'SELECT count(*) AS n FROM finance.invoice_items i WHERE fee_rule_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM finance.fee_rules f WHERE f.id = i.fee_rule_id)',
            'payroll_details.fee_rule_id yatim'    => 'SELECT count(*) AS n FROM finance.payroll_details d WHERE fee_rule_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM finance.fee_rules f WHERE f.id = d.fee_rule_id)',
        ];
        foreach ($violations as $label => $sql) {
            if (($n = DB::selectOne($sql)->n) > 0) {
                throw new RuntimeException("Migration dibatalkan: {$n} baris melanggar aturan {$label}. Perbaiki datanya dulu.");
            }
        }

        DB::statement('ALTER TABLE finance.payments ADD CONSTRAINT chk_payments_total_positive CHECK (total_amount > 0)');
        DB::statement('ALTER TABLE finance.payment_details ADD CONSTRAINT chk_payment_details_amount_positive CHECK (amount_paid > 0)');

        DB::statement('ALTER TABLE finance.invoice_items ADD CONSTRAINT fk_invoice_items_fee_rule FOREIGN KEY (fee_rule_id) REFERENCES finance.fee_rules(id) ON DELETE RESTRICT NOT VALID');
        DB::statement('ALTER TABLE finance.invoice_items VALIDATE CONSTRAINT fk_invoice_items_fee_rule');
        DB::statement('ALTER TABLE finance.payroll_details ADD CONSTRAINT fk_payroll_details_fee_rule FOREIGN KEY (fee_rule_id) REFERENCES finance.fee_rules(id) ON DELETE RESTRICT NOT VALID');
        DB::statement('ALTER TABLE finance.payroll_details VALIDATE CONSTRAINT fk_payroll_details_fee_rule');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE finance.payroll_details DROP CONSTRAINT IF EXISTS fk_payroll_details_fee_rule');
        DB::statement('ALTER TABLE finance.invoice_items DROP CONSTRAINT IF EXISTS fk_invoice_items_fee_rule');
        DB::statement('ALTER TABLE finance.payment_details DROP CONSTRAINT IF EXISTS chk_payment_details_amount_positive');
        DB::statement('ALTER TABLE finance.payments DROP CONSTRAINT IF EXISTS chk_payments_total_positive');
    }
};
