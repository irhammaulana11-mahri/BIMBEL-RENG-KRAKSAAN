<?php

namespace Tests\Feature\Finance;

use App\Models\Admin\User;
use App\Models\Finance\Invoice;
use App\Models\Finance\Payment;
use App\Models\Finance\PaymentDetail;
use App\Services\Finance\InvoiceService;
use App\Services\Finance\PaymentService;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use PHPUnit\Framework\Attributes\Group;
use Tests\Concerns\BuildsAuditFixtures;
use Tests\TestCase;

/**
 * Integritas tagihan & pembayaran (uji F-1..F-5 audit).
 */
class PaymentIntegrityTest extends TestCase
{
    use BuildsAuditFixtures;

    protected function setUp(): void {
        parent::setUp();
        $this->buildAuditFixtures();
        $this->actingAs(User::findOrFail($this->f['admin']));
    }

    private function pendingPayment(string $invoiceKey, float $amount = 300000): Payment {
        $invoice = Invoice::findOrFail($this->f[$invoiceKey]);
        $payment = Payment::create([
            'student_id' => $invoice->student_id, 'payment_no' => 'PAY-UJI-' . Str::random(6), 'payment_date' => '2026-10-10',
            'payment_method' => 'TRANSFER', 'status' => 'PENDING', 'total_amount' => $amount,
        ]);
        PaymentDetail::create(['payment_id' => $payment->id, 'invoice_id' => $invoice->id, 'amount_paid' => $amount]);
        return $payment;
    }

    /** F-1: Admin kedua menolak dengan data yang dibuka saat pembayaran masih PENDING. */
    public function test_at30_reject_atas_pembayaran_yang_sudah_disetujui_ditolak(): void {
        $payment = $this->pendingPayment('invA');
        $stale = Payment::findOrFail($payment->id);
        $service = app(PaymentService::class);

        $service->approve(Payment::findOrFail($payment->id));

        try {
            $service->reject($stale, 'uji data basi');
            $rejected = true;
        } catch (ValidationException) {
            $rejected = false;
        }

        $this->assertFalse($rejected, 'Reject atas pembayaran yang sudah CONFIRMED seharusnya ditolak');
        $this->assertSame('CONFIRMED', $payment->refresh()->status);
        $this->assertSame('PAID', Invoice::findOrFail($this->f['invA'])->status);
    }

    public function test_at30_approve_atas_pembayaran_yang_sudah_ditolak_ditolak(): void {
        $payment = $this->pendingPayment('invA');
        $stale = Payment::findOrFail($payment->id);
        $service = app(PaymentService::class);
        $service->reject(Payment::findOrFail($payment->id), 'bukti tidak terbaca');

        $this->expectException(ValidationException::class);
        try {
            $service->approve($stale);
        } finally {
            $this->assertSame('REJECTED', $payment->refresh()->status);
            $this->assertSame('UNPAID', Invoice::findOrFail($this->f['invA'])->status);
        }
    }

    public function test_at30_reject_lewat_api_atas_pembayaran_terkonfirmasi_422(): void {
        $payment = $this->pendingPayment('invA');
        app(PaymentService::class)->approve($payment);

        $this->api('PATCH', "/admin/finance/payments/{$payment->id}/reject", $this->tokenFor($this->f['admin']), ['reason' => 'salah'])
            ->assertStatus(422);
        $this->assertSame('CONFIRMED', $payment->refresh()->status);
    }

    /** D-09 + Q-10: Admin tidak bisa mencatat pembayaran untuk tagihan yang masih punya PENDING. */
    public function test_at33_admin_mencatat_pembayaran_saat_ada_pending_ditolak(): void {
        $this->pendingPayment('invA', 100000);

        $this->expectException(ValidationException::class);
        app(PaymentService::class)->recordByAdmin([
            'student_id' => $this->f['sA'], 'payment_date' => '2026-10-10', 'payment_method' => 'CASH',
            'allocations' => [['invoice_id' => $this->f['invA'], 'amount' => 50000]],
        ]);
    }

    /** D-09: pembayaran multi-tagihan ditolak bila salah satu tagihannya punya PENDING. */
    public function test_at33_pembayaran_multi_tagihan_ditolak_bila_salah_satu_pending(): void {
        $second = $this->insert('finance.invoices', [
            'student_id' => $this->f['sA'], 'class_id' => $this->f['cA'], 'invoice_no' => 'INV-UJI-A2',
            'issue_date' => '2026-11-01', 'due_date' => '2026-11-30', 'period_month' => 11, 'period_year' => 2026,
            'subtotal' => 200000, 'discount' => 0, 'total_amount' => 200000, 'paid_amount' => 0, 'remaining_amount' => 200000, 'status' => 'UNPAID',
        ]);
        $this->pendingPayment('invA', 100000);

        try {
            app(PaymentService::class)->recordByAdmin([
                'student_id' => $this->f['sA'], 'payment_date' => '2026-10-10', 'payment_method' => 'CASH',
                'allocations' => [['invoice_id' => $second, 'amount' => 200000], ['invoice_id' => $this->f['invA'], 'amount' => 50000]],
            ]);
            $this->fail('Seharusnya ditolak karena INV-UJI-A masih punya pembayaran PENDING');
        } catch (ValidationException $e) {
            $this->assertStringContainsString('INV-UJI-A', collect($e->errors())->flatten()->implode(' '));
        }
        $this->assertSame('UNPAID', Invoice::findOrFail($second)->status);
    }

    public function test_at31_setelah_pending_ditolak_orang_tua_bisa_mengajukan_lagi(): void {
        Storage::fake(PaymentService::PROOF_DISK);
        $payment = $this->pendingPayment('invA', 100000);
        app(PaymentService::class)->reject($payment, 'bukti buram');

        $this->api('POST', "/parent/invoices/{$this->f['invA']}/payments", $this->tokenFor($this->f['puA']), [
            'amount' => 100000, 'payment_date' => '2026-10-10', 'payment_channel' => 'BCA',
            'proof' => UploadedFile::fake()->create('bukti.pdf', 50, 'application/pdf'),
        ])->assertSuccessful();
    }

    public function test_at31_bukti_bayar_yang_ditolak_tidak_tersimpan(): void {
        Storage::fake(PaymentService::PROOF_DISK);
        $this->pendingPayment('invA', 100000);

        $this->api('POST', "/parent/invoices/{$this->f['invA']}/payments", $this->tokenFor($this->f['puA']), [
            'amount' => 100000, 'payment_date' => '2026-10-10', 'payment_channel' => 'BCA',
            'proof' => UploadedFile::fake()->create('bukti.pdf', 50, 'application/pdf'),
        ])->assertStatus(422);

        $this->assertEmpty(Storage::disk(PaymentService::PROOF_DISK)->allFiles());
    }

    /** FIN-05: pelanggaran unique constraint di API menjadi 422 berpesan, bukan 500. */
    public function test_at35_pelanggaran_unique_constraint_menjadi_422(): void {
        $this->mock(\App\Services\Finance\PayrollService::class, fn($m) => $m->shouldReceive('transfer')->andThrow(
            new UniqueConstraintViolationException('pgsql', 'insert into finance.payroll_transfers', [], new \Exception('duplicate key'))
        ));
        $payroll = $this->insert('finance.payrolls', [
            'payroll_no' => 'PR-UJI', 'period_month' => 10, 'period_year' => 2026, 'payroll_date' => '2026-10-31',
            'total_tutors' => 1, 'total_sessions' => 1, 'total_teaching_minutes' => 90, 'total_amount' => 100000, 'status' => 'APPROVED',
        ]);

        $this->api('POST', "/admin/finance/payrolls/$payroll/transfers", $this->tokenFor($this->f['admin']), [
            'tentor_id' => $this->f['tA'], 'transfer_date' => now()->toDateString(), 'reference_no' => 'TRF-1',
        ])->assertStatus(422)
            ->assertJsonPath('success', false)
            ->assertJsonPath('message', 'Data yang sama sudah tercatat atau sedang diproses. Muat ulang halaman lalu periksa kembali.');
    }

    /** F-2 */
    public function test_at34_pembayaran_melebihi_sisa_tagihan_ditolak(): void {
        $this->expectException(ValidationException::class);
        app(PaymentService::class)->recordByAdmin([
            'student_id' => $this->f['sB'], 'payment_date' => '2026-10-10', 'payment_method' => 'CASH',
            'allocations' => [['invoice_id' => $this->f['invB'], 'amount' => 999999]],
        ]);
    }

    /** F-3 */
    public function test_at34_generate_tagihan_dua_kali_tidak_menggandakan(): void {
        $service = app(InvoiceService::class);
        $service->generateMonthly(2026, 10, '2026-10-30');
        $afterFirst = Invoice::where('period_year', 2026)->where('period_month', 10)->count();

        $service->generateMonthly(2026, 10, '2026-10-30');

        $this->assertSame($afterFirst, Invoice::where('period_year', 2026)->where('period_month', 10)->count());
    }

    /** F-4: constraint DB menolak tagihan ganda yang melewati aplikasi. */
    public function test_at34_database_menolak_tagihan_ganda_per_periode(): void {
        $this->expectException(UniqueConstraintViolationException::class);
        DB::transaction(fn() => $this->insert('finance.invoices', [
            'student_id' => $this->f['sB'], 'class_id' => $this->f['cB'], 'invoice_no' => 'INV-UJI-DUP',
            'issue_date' => '2026-10-01', 'due_date' => '2026-10-30', 'period_month' => 10, 'period_year' => 2026,
            'subtotal' => 1, 'discount' => 0, 'total_amount' => 1, 'paid_amount' => 0, 'remaining_amount' => 1, 'status' => 'UNPAID',
        ]));
    }

    /** D-09, jalur berurutan. Jalur paralel (AT-32) diuji di T5 dengan dua koneksi. */
    public function test_at31_pengajuan_bukti_bayar_kedua_untuk_tagihan_yang_sama_ditolak(): void {
        Storage::fake(PaymentService::PROOF_DISK);
        $token = $this->tokenFor($this->f['puA']);
        $submit = fn() => $this->api('POST', "/parent/invoices/{$this->f['invA']}/payments", $token, [
            'amount' => 100000, 'payment_date' => '2026-10-10', 'payment_channel' => 'BCA',
            'proof' => UploadedFile::fake()->create('bukti.pdf', 50, 'application/pdf'),
        ]);

        $submit()->assertSuccessful();
        $submit()->assertStatus(422);

        $this->assertSame(1, Payment::where('status', 'PENDING')->whereHas('details', fn($q) => $q->where('invoice_id', $this->f['invA']))->count());
    }

    /** F-5: absensi siswa dikunci setelah tagihan bulan itu terbit (D-01). */
    #[Group('temuan-terbuka'), Group('FIN-02')]
    public function test_at60_admin_tidak_bisa_mengubah_absensi_setelah_tagihan_terbit(): void {
        $this->api('POST', "/admin/attendances/sessions/{$this->f['ssB']}/students", $this->tokenFor($this->f['admin']), [
            'attendances' => [['student_id' => $this->f['sB'], 'attendance_status' => 'ALPA']],
        ])->assertStatus(422);

        $this->assertDatabaseHas('academic.student_attendances', ['session_id' => $this->f['ssB'], 'student_id' => $this->f['sB'], 'attendance_status' => 'HADIR']);
    }
}
