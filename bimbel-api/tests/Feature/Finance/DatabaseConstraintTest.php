<?php

namespace Tests\Feature\Finance;

use App\Models\Admin\User;
use App\Services\Finance\InvoiceService;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Tests\Concerns\BuildsAuditFixtures;
use Tests\TestCase;

/**
 * Constraint integritas keuangan di database (T10: nominal > 0, FK fee_rule_id).
 */
class DatabaseConstraintTest extends TestCase
{
    use BuildsAuditFixtures;

    protected function setUp(): void {
        parent::setUp();
        $this->buildAuditFixtures();
    }

    private function assertRejected(string $sqlState, callable $write): void {
        try {
            DB::transaction($write);
            $this->fail("Seharusnya ditolak database (SQLSTATE $sqlState)");
        } catch (QueryException $e) {
            $this->assertSame($sqlState, $e->errorInfo[0]);
        }
    }

    public function test_at70_nominal_pembayaran_nol_atau_negatif_ditolak_database(): void {
        $this->assertRejected('23514', fn() => $this->insert('finance.payments', [
            'student_id' => $this->f['sA'], 'payment_no' => 'PAY-NOL', 'payment_date' => '2026-10-10', 'payment_method' => 'CASH', 'status' => 'CONFIRMED', 'total_amount' => 0,
        ]));
        $payment = $this->insert('finance.payments', [
            'student_id' => $this->f['sA'], 'payment_no' => 'PAY-OK', 'payment_date' => '2026-10-10', 'payment_method' => 'CASH', 'status' => 'PENDING', 'total_amount' => 1000,
        ]);
        $this->assertRejected('23514', fn() => $this->insert('finance.payment_details', [
            'payment_id' => $payment, 'invoice_id' => $this->f['invA'], 'amount_paid' => -500,
        ]));
    }

    public function test_at71_fee_rule_id_acak_ditolak_database(): void {
        $this->assertRejected('23503', fn() => $this->insert('finance.invoice_items', [
            'invoice_id' => $this->f['invA'], 'item_type' => 'SERVICE', 'item_name' => 'X', 'quantity' => 1, 'unit_price' => 1,
            'discount' => 0, 'subtotal' => 1, 'sort_order' => 1, 'fee_rule_id' => (string) Str::uuid(),
        ]));
        $payroll = $this->insert('finance.payrolls', ['payroll_no' => 'PRL-X', 'period_month' => 10, 'period_year' => 2026, 'payroll_date' => '2026-10-31',
            'total_tutors' => 0, 'total_sessions' => 0, 'total_teaching_minutes' => 0, 'total_amount' => 0, 'status' => 'DRAFT']);
        $this->assertRejected('23503', fn() => $this->insert('finance.payroll_details', [
            'payroll_id' => $payroll, 'tentor_id' => $this->f['tA'], 'teaching_minutes' => 0, 'rate_per_session' => 0, 'rate_per_hour' => 0,
            'subtotal' => 1, 'quantity' => 1, 'unit_amount' => 1, 'fee_rule_id' => (string) Str::uuid(),
        ]));
    }

    public function test_aturan_tarif_yang_sudah_dipakai_tidak_bisa_dihapus_tetapi_yang_belum_bisa(): void {
        $used = $this->insert('finance.fee_rules', ['rule_type' => 'BILLING', 'method' => 'PER_MEETING', 'name' => 'Dipakai', 'amount' => 100000, 'is_active' => true, 'effective_from' => '2026-01-01']);
        $unused = $this->insert('finance.fee_rules', ['rule_type' => 'BILLING', 'method' => 'MONTHLY', 'name' => 'Belum dipakai', 'amount' => 1, 'is_active' => true, 'effective_from' => '2030-01-01']);
        $this->actingAs(User::findOrFail($this->f['admin']));
        DB::table('finance.invoices')->delete();
        app(InvoiceService::class)->generateMonthly(2026, 10, '2026-10-30');
        $this->assertDatabaseHas('finance.invoice_items', ['fee_rule_id' => $used]);
        $token = $this->tokenFor($this->f['admin']);

        $this->api('DELETE', "/admin/finance/fee-rules/$used", $token)->assertStatus(422);
        $this->assertDatabaseHas('finance.fee_rules', ['id' => $used]);
        $this->api('DELETE', "/admin/finance/fee-rules/$unused", $token)->assertOk();
        $this->assertDatabaseMissing('finance.fee_rules', ['id' => $unused]);
    }
}
