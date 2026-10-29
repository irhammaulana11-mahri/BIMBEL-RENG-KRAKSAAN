<?php

namespace Tests\Feature\Finance;

use App\Models\Admin\User;
use App\Models\Finance\FinanceAuditLog;
use App\Models\Finance\Invoice;
use App\Models\Finance\Payment;
use App\Models\Finance\PaymentReversal;
use App\Notifications\PortalNotification;
use App\Services\Finance\CashflowService;
use App\Services\Finance\PaymentService;
use Illuminate\Support\Facades\Notification;
use Tests\Concerns\BuildsAuditFixtures;
use Tests\TestCase;

/**
 * Reversal pembayaran CONFIRMED (D-02) dengan kontrol operator tunggal (D-11).
 */
class PaymentReversalTest extends TestCase
{
    use BuildsAuditFixtures;

    private Payment $payment;
    private string $admin;

    protected function setUp(): void {
        parent::setUp();
        $this->buildAuditFixtures();
        $this->actingAs(User::findOrFail($this->f['admin']));
        // Tagihan A lunas lewat pembayaran tunai Rp 300.000 pada 10 Okt 2026
        $this->payment = app(PaymentService::class)->recordByAdmin([
            'student_id' => $this->f['sA'], 'payment_date' => '2026-10-10', 'payment_method' => 'CASH',
            'allocations' => [['invoice_id' => $this->f['invA'], 'amount' => 300000]],
        ]);
        $this->admin = $this->tokenFor($this->f['admin']);
    }

    private function requestReversal(string $reason = 'Salah input siswa, uang milik siswa B'): string {
        return $this->api('POST', "/admin/finance/payments/{$this->payment->id}/reversals", $this->admin, ['reason' => $reason])
            ->assertCreated()->json('data.id');
    }

    public function test_at41_reversal_disetujui_pembayaran_asli_tetap_dan_tagihan_dihitung_ulang(): void {
        $this->assertSame('PAID', Invoice::findOrFail($this->f['invA'])->status);
        $id = $this->requestReversal();

        $this->api('PATCH', "/admin/finance/payment-reversals/$id/approve", $this->admin, [
            'password' => self::PASSWORD, 'note' => 'Sudah dicek dengan mutasi kas',
        ])->assertOk()->assertJsonPath('data.status', 'APPROVED')->assertJsonPath('data.self_approved', true);

        $this->assertSame('CONFIRMED', $this->payment->refresh()->status);
        $this->assertDatabaseHas('finance.payments', ['id' => $this->payment->id]);
        $invoice = Invoice::findOrFail($this->f['invA']);
        $this->assertSame('UNPAID', $invoice->status);
        $this->assertEquals(0, $invoice->paid_amount);
        $this->assertEquals(300000, $invoice->remaining_amount);
    }

    public function test_at41_reversal_pada_pembayaran_sebagian_mengembalikan_status_partial(): void {
        $partial = app(PaymentService::class)->recordByAdmin([
            'student_id' => $this->f['sB'], 'payment_date' => '2026-10-10', 'payment_method' => 'CASH',
            'allocations' => [['invoice_id' => $this->f['invB'], 'amount' => 100000]],
        ]);
        app(PaymentService::class)->recordByAdmin([
            'student_id' => $this->f['sB'], 'payment_date' => '2026-10-11', 'payment_method' => 'CASH',
            'allocations' => [['invoice_id' => $this->f['invB'], 'amount' => 200000]],
        ]);
        $id = $this->api('POST', "/admin/finance/payments/{$partial->id}/reversals", $this->admin, ['reason' => 'Dicatat dobel oleh admin'])->json('data.id');
        $this->api('PATCH', "/admin/finance/payment-reversals/$id/approve", $this->admin, ['password' => self::PASSWORD, 'note' => 'Pencatatan dobel'])->assertOk();

        $invoice = Invoice::findOrFail($this->f['invB']);
        $this->assertSame('PARTIAL', $invoice->status);
        $this->assertEquals(200000, $invoice->paid_amount);
    }

    public function test_at40_mode_terpisah_pengaju_tidak_bisa_menyetujui_sendiri(): void {
        config(['finance.approval_mode' => 'separated']);
        $id = $this->requestReversal();

        $this->api('PATCH', "/admin/finance/payment-reversals/$id/approve", $this->admin, ['note' => 'setuju sendiri'])->assertStatus(422);
        $this->api('PATCH', "/admin/finance/payment-reversals/$id/approve", $this->tokenFor($this->f['super']), [])->assertOk()
            ->assertJsonPath('data.self_approved', false);
    }

    public function test_at40_mode_tunggal_wajib_password_dan_alasan(): void {
        $id = $this->requestReversal();

        $this->api('PATCH', "/admin/finance/payment-reversals/$id/approve", $this->admin, ['note' => 'Sudah dicek dengan mutasi kas'])
            ->assertStatus(422)->assertJsonValidationErrors('password');
        $this->api('PATCH', "/admin/finance/payment-reversals/$id/approve", $this->admin, ['password' => 'salah', 'note' => 'Sudah dicek dengan mutasi kas'])
            ->assertStatus(422)->assertJsonValidationErrors('password');
        $this->api('PATCH', "/admin/finance/payment-reversals/$id/approve", $this->admin, ['password' => self::PASSWORD, 'note' => 'ok'])
            ->assertStatus(422)->assertJsonValidationErrors('note');

        $this->assertSame('PENDING', PaymentReversal::findOrFail($id)->status);
        $this->assertSame('PAID', Invoice::findOrFail($this->f['invA'])->status);
    }

    public function test_at40_mode_tunggal_penyetuju_lain_tetap_wajib_password_tanpa_alasan(): void {
        $id = $this->requestReversal();
        $super = $this->tokenFor($this->f['super']);

        $this->api('PATCH', "/admin/finance/payment-reversals/$id/approve", $super, [])->assertStatus(422);
        $this->api('PATCH', "/admin/finance/payment-reversals/$id/approve", $super, ['password' => self::PASSWORD])->assertOk()
            ->assertJsonPath('data.self_approved', false);
    }

    public function test_at42_reversal_kedua_untuk_pembayaran_yang_sama_ditolak(): void {
        $this->requestReversal();
        $this->api('POST', "/admin/finance/payments/{$this->payment->id}/reversals", $this->admin, ['reason' => 'Pengajuan kedua kalinya'])->assertStatus(422);
    }

    public function test_at42_setelah_reversal_ditolak_bisa_diajukan_lagi(): void {
        $id = $this->requestReversal();
        $this->api('PATCH', "/admin/finance/payment-reversals/$id/reject", $this->admin, ['note' => 'Pembayaran benar'])->assertOk();
        $this->assertSame('PAID', Invoice::findOrFail($this->f['invA'])->status);

        $this->requestReversal('Ternyata memang salah siswa');
    }

    public function test_at43_reversal_tanpa_alasan_ditolak(): void {
        $this->api('POST', "/admin/finance/payments/{$this->payment->id}/reversals", $this->admin, ['reason' => ''])->assertStatus(422);
        $this->api('POST', "/admin/finance/payments/{$this->payment->id}/reversals", $this->admin, ['reason' => 'salah'])->assertStatus(422);
    }

    public function test_at43_hanya_pembayaran_confirmed_yang_bisa_direversal(): void {
        $pending = Payment::create(['student_id' => $this->f['sB'], 'payment_no' => 'PAY-UJI-P', 'payment_date' => '2026-10-10', 'payment_method' => 'TRANSFER', 'status' => 'PENDING', 'total_amount' => 1000]);
        $this->api('POST', "/admin/finance/payments/{$pending->id}/reversals", $this->admin, ['reason' => 'Belum dikonfirmasi'])->assertStatus(422);
    }

    public function test_at44_jejak_audit_reversal_lengkap(): void {
        $id = $this->requestReversal();
        $this->api('PATCH', "/admin/finance/payment-reversals/$id/approve", $this->admin, ['password' => self::PASSWORD, 'note' => 'Sudah dicek dengan mutasi kas'])->assertOk();

        $logs = FinanceAuditLog::where('entity_id', $id)->orderBy('created_at')->orderBy('id')->get();
        $this->assertSame(['REQUESTED', 'APPROVED'], $logs->pluck('action')->all());
        $this->assertSame('Salah input siswa, uang milik siswa B', $logs[0]->reason);
        $this->assertEquals(300000, $logs[0]->after['amount']);
        $this->assertSame(['approval_mode' => 'single_operator', 'self_approved' => true], $logs[1]->meta);
        $this->assertSame($this->f['admin'], $logs[1]->actor_id);

        $paymentLog = FinanceAuditLog::where('entity_id', $this->payment->id)->where('action', 'REVERSED')->sole();
        $this->assertSame($id, $paymentLog->meta['reversal_id']);
    }

    public function test_at44_orang_tua_diberi_tahu_saat_reversal_disetujui(): void {
        Notification::fake();
        $id = $this->requestReversal();
        Notification::assertNothingSent();

        $this->api('PATCH', "/admin/finance/payment-reversals/$id/approve", $this->admin, ['password' => self::PASSWORD, 'note' => 'Sudah dicek dengan mutasi kas'])->assertOk();

        Notification::assertSentTo(User::findOrFail($this->f['puA']), PortalNotification::class);
        Notification::assertNotSentTo(User::findOrFail($this->f['puB']), PortalNotification::class);
    }

    public function test_api_menampilkan_tanda_reversal_ke_admin_dan_orang_tua(): void {
        $id = $this->requestReversal();
        $this->api('PATCH', "/admin/finance/payment-reversals/$id/approve", $this->admin, ['password' => self::PASSWORD, 'note' => 'Sudah dicek dengan mutasi kas']);

        $this->api('GET', "/admin/finance/payments/{$this->payment->id}", $this->admin)->assertOk()
            ->assertJsonPath('data.status', 'CONFIRMED')->assertJsonPath('data.reversed', true)
            ->assertJsonPath('data.reversal.status', 'APPROVED');
        $this->api('GET', "/parent/invoices/{$this->f['invA']}", $this->tokenFor($this->f['puA']))->assertOk()
            ->assertJsonPath('data.status', 'UNPAID')->assertJsonPath('data.payments.0.reversed', true);
        $this->api('GET', '/parent/payments', $this->tokenFor($this->f['puA']))->assertOk()->assertJsonPath('data.0.reversed', true);
    }

    /** Arus kas: bulan pembayaran asli tidak berubah, reversal mengurangi bulan disetujuinya. */
    public function test_arus_kas_mencatat_reversal_di_bulan_persetujuan(): void {
        $this->travelTo(now()->setDate(2026, 11, 3));
        $this->admin = $this->tokenFor($this->f['admin']); // token lama sudah lewat 12 jam
        $id = $this->requestReversal();
        $this->api('PATCH', "/admin/finance/payment-reversals/$id/approve", $this->admin, ['password' => self::PASSWORD, 'note' => 'Sudah dicek dengan mutasi kas'])->assertOk();

        $cashflow = app(CashflowService::class);
        $this->assertEquals(300000, $cashflow->summary(2026, 10)['income']);
        $this->assertEquals(-300000, $cashflow->summary(2026, 11)['income']);
    }

    public function test_invoice_pdf_tidak_menghitung_pembayaran_yang_direversal(): void {
        $id = $this->requestReversal();
        $this->api('PATCH', "/admin/finance/payment-reversals/$id/approve", $this->admin, ['password' => self::PASSWORD, 'note' => 'Sudah dicek dengan mutasi kas']);

        $invoice = Invoice::with(['student.parents', 'classroom', 'items', 'paymentDetails.payment.approvedReversal'])->findOrFail($this->f['invA']);
        $html = view('pdf.invoice', ['invoice' => $invoice, 'company' => ['name' => 'Bimbel Uji', 'address' => null, 'contact' => '', 'logo' => null]])->render();
        $this->assertStringNotContainsString($this->payment->payment_no, $html);
    }

    public function test_tentor_dan_orang_tua_tidak_bisa_mengakses_reversal(): void {
        $this->api('GET', '/admin/finance/payment-reversals', $this->tokenFor($this->f['tuA']))->assertStatus(403);
        $this->api('POST', "/admin/finance/payments/{$this->payment->id}/reversals", $this->tokenFor($this->f['puA']), ['reason' => 'Coba batalkan sendiri'])->assertStatus(403);
    }
}
