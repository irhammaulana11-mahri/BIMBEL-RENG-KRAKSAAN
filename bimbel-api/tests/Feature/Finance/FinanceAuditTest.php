<?php

namespace Tests\Feature\Finance;

use App\Models\Admin\User;
use App\Models\Finance\FinanceAuditLog;
use App\Models\Finance\Invoice;
use App\Models\Finance\Payment;
use App\Models\Finance\PaymentDetail;
use App\Services\Finance\InvoiceService;
use App\Services\Finance\PaymentService;
use App\Services\Finance\PayrollService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use LogicException;
use Tests\Concerns\BuildsAuditFixtures;
use Tests\TestCase;

/**
 * Jejak audit keuangan (D-10): setiap aksi keuangan tercatat dengan aktor, kondisi sebelum/sesudah,
 * dan alasan; tersimpan atau batal bersama perubahannya; tidak dapat diubah/dihapus.
 */
class FinanceAuditTest extends TestCase
{
    use BuildsAuditFixtures;

    protected function setUp(): void {
        parent::setUp();
        $this->buildAuditFixtures();
        $this->actingAs(User::findOrFail($this->f['admin']));
    }

    private function logsFor(string $entityId) {
        return FinanceAuditLog::where('entity_id', $entityId)->orderBy('created_at')->orderBy('id')->get();
    }

    private function pendingPayment(): Payment {
        $payment = Payment::create(['student_id' => $this->f['sA'], 'payment_no' => 'PAY-UJI-AUD', 'payment_date' => '2026-10-10', 'payment_method' => 'TRANSFER', 'status' => 'PENDING', 'total_amount' => 300000]);
        PaymentDetail::create(['payment_id' => $payment->id, 'invoice_id' => $this->f['invA'], 'amount_paid' => 300000]);
        return $payment;
    }

    public function test_at44_pengajuan_dan_persetujuan_pembayaran_tercatat(): void {
        Storage::fake(PaymentService::PROOF_DISK);
        $this->api('POST', "/parent/invoices/{$this->f['invA']}/payments", $this->tokenFor($this->f['puA']), [
            'amount' => 300000, 'payment_date' => '2026-10-10', 'payment_channel' => 'BCA',
            'proof' => UploadedFile::fake()->create('bukti.pdf', 50, 'application/pdf'),
        ])->assertSuccessful();
        $payment = Payment::where('status', 'PENDING')->sole();

        $this->api('PATCH', "/admin/finance/payments/{$payment->id}/approve", $this->tokenFor($this->f['admin']))->assertSuccessful();

        $logs = $this->logsFor($payment->id);
        $this->assertSame(['SUBMITTED', 'APPROVED'], $logs->pluck('action')->all());
        $this->assertSame($this->f['puA'], $logs[0]->actor_id);
        $this->assertSame('Ortu A', $logs[0]->actor_name);
        $this->assertSame($this->f['admin'], $logs[1]->actor_id);
        $this->assertSame('PENDING', $logs[1]->before['status']);
        $this->assertSame('CONFIRMED', $logs[1]->after['status']);
        $this->assertEquals(300000, $logs[1]->after['total_amount']);
        $this->assertNotNull($logs[1]->ip_address);
    }

    public function test_at44_penolakan_pembayaran_mencatat_alasan(): void {
        $payment = $this->pendingPayment();
        app(PaymentService::class)->reject($payment, 'Nominal tidak sesuai mutasi');

        $log = $this->logsFor($payment->id)->sole();
        $this->assertSame('REJECTED', $log->action);
        $this->assertSame('Nominal tidak sesuai mutasi', $log->reason);
        $this->assertSame('PENDING', $log->before['status']);
    }

    public function test_at44_pembayaran_tunai_oleh_admin_tercatat(): void {
        $payment = app(PaymentService::class)->recordByAdmin([
            'student_id' => $this->f['sA'], 'payment_date' => '2026-10-10', 'payment_method' => 'CASH',
            'allocations' => [['invoice_id' => $this->f['invA'], 'amount' => 100000]],
        ]);

        $log = $this->logsFor($payment->id)->sole();
        $this->assertSame('RECORDED', $log->action);
        $this->assertSame($this->f['invA'], $log->meta['allocations'][0]['invoice_id']);
    }

    public function test_at44_tagihan_manual_dan_pembatalannya_tercatat(): void {
        $invoice = app(InvoiceService::class)->createManual([
            'student_id' => $this->f['sA'], 'class_id' => $this->f['cA'], 'due_date' => now()->addWeek()->toDateString(),
            'items' => [['item_name' => 'Modul', 'quantity' => 1, 'unit_price' => 75000]],
        ]);
        app(InvoiceService::class)->cancel($invoice, 'Salah siswa');

        $logs = $this->logsFor($invoice->id);
        $this->assertSame(['CREATED', 'CANCELLED'], $logs->pluck('action')->all());
        $this->assertSame('manual', $logs[0]->meta['source']);
        $this->assertSame('Modul', $logs[0]->meta['items'][0]['name']);
        $this->assertSame('Salah siswa', $logs[1]->reason);
        $this->assertSame('UNPAID', $logs[1]->before['status']);
        $this->assertSame('CANCELLED', $logs[1]->after['status']);
    }

    public function test_at44_siklus_payroll_tercatat(): void {
        $this->insert('academic.tentor_attendances', [
            'session_id' => $this->f['ssA'], 'tentor_id' => $this->f['tA'], 'attendance_status' => 'HADIR', 'teaching_minutes' => 90,
        ]);
        $this->insert('finance.fee_rules', [
            'rule_type' => 'PAYROLL', 'method' => 'PER_MEETING', 'name' => 'Honor uji', 'amount' => 50000, 'is_active' => true, 'effective_from' => '2026-01-01',
        ]);
        $service = app(PayrollService::class);

        $payroll = $service->generate(2026, 10);
        $service->generate(2026, 10);
        $service->approve($payroll->refresh());
        $transfer = $service->transfer($payroll->refresh(), $this->f['tA'], ['transfer_date' => now()->toDateString(), 'reference_no' => 'TRF-UJI']);

        $this->assertSame(['GENERATED', 'REGENERATED', 'APPROVED', 'PAID'], $this->logsFor($payroll->id)->pluck('action')->all());
        $transferLog = $this->logsFor($transfer->id)->sole();
        $this->assertSame('TRANSFERRED', $transferLog->action);
        $this->assertSame('TRF-UJI', $transferLog->after['reference_no']);
        $this->assertSame($payroll->id, $transferLog->meta['payroll_id']);
    }

    /** Aksi yang gagal tidak meninggalkan jejak; jejak ikut batal bersama perubahannya. */
    public function test_at44_aksi_yang_gagal_tidak_tercatat(): void {
        $payment = $this->pendingPayment();
        app(PaymentService::class)->approve($payment);

        try {
            app(PaymentService::class)->reject(Payment::findOrFail($payment->id), 'terlambat');
        } catch (ValidationException) {
        }

        $this->assertSame(['APPROVED'], $this->logsFor($payment->id)->pluck('action')->all());
    }

    public function test_at44_jejak_tidak_bisa_diubah_atau_dihapus(): void {
        app(PaymentService::class)->reject($this->pendingPayment(), 'uji');
        $log = FinanceAuditLog::sole();

        try {
            $log->update(['reason' => 'diubah']);
            $this->fail('Mengubah jejak audit seharusnya ditolak');
        } catch (LogicException) {
        }
        try {
            $log->delete();
            $this->fail('Menghapus jejak audit seharusnya ditolak');
        } catch (LogicException) {
        }
        $this->assertSame('uji', $log->fresh()->reason);
    }

    public function test_at44_endpoint_daftar_jejak_dengan_filter(): void {
        $payment = $this->pendingPayment();
        app(PaymentService::class)->reject($payment, 'uji');
        app(InvoiceService::class)->cancel(Invoice::findOrFail($this->f['invB']), 'uji batal');
        $token = $this->tokenFor($this->f['admin']);

        $this->api('GET', '/admin/finance/audit-logs', $token)->assertOk()->assertJsonCount(2, 'data');
        $this->api('GET', '/admin/finance/audit-logs?entity_type=payment', $token)
            ->assertOk()->assertJsonCount(1, 'data')->assertJsonPath('data.0.action', 'REJECTED');
        $this->api('GET', "/admin/finance/audit-logs?entity_id={$this->f['invB']}", $token)
            ->assertOk()->assertJsonPath('data.0.action', 'CANCELLED');
        $this->api('GET', '/admin/finance/audit-logs?entity_type=bukan', $token)->assertStatus(422);
    }

    public function test_at44_endpoint_jejak_khusus_admin(): void {
        $this->api('GET', '/admin/finance/audit-logs', $this->tokenFor($this->f['tuA']))->assertStatus(403);
        $this->api('GET', '/admin/finance/audit-logs', $this->tokenFor($this->f['puA']))->assertStatus(403);
    }
}
