<?php

namespace Tests\Feature\Finance;

use App\Models\Academic\AttendanceCorrection;
use App\Models\Academic\ScheduleSession;
use App\Models\Admin\User;
use App\Models\Finance\CreditNote;
use App\Models\Finance\FinanceAuditLog;
use App\Models\Finance\Invoice;
use App\Models\Finance\PayrollAdjustment;
use App\Models\Finance\PayrollDetail;
use App\Models\Finance\Refund;
use App\Notifications\PortalNotification;
use App\Services\Academic\AttendanceCorrectionService;
use App\Services\Finance\InvoiceService;
use App\Services\Finance\PaymentService;
use App\Services\Finance\PayrollService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Tests\Concerns\BuildsAuditFixtures;
use Tests\TestCase;

/**
 * Kunci absensi siswa & koreksi beserta dampak keuangannya (D-01, Q-01..Q-03).
 *
 * Tarif uji: tagihan Rp 100.000 per pertemuan HADIR; honor Rp 50.000 per pertemuan dengan siswa HADIR.
 * Siswa A di kelas A: sesi 5 Okt HADIR, sesi 12 Okt ALPA → tagihan Oktober 1 pertemuan = Rp 100.000.
 */
class AttendanceCorrectionTest extends TestCase
{
    use BuildsAuditFixtures;

    private string $billingRule;
    private string $session2;
    private Invoice $invoice;
    private AttendanceCorrectionService $service;
    private int $meetingNo = 1;

    protected function setUp(): void {
        parent::setUp();
        $this->buildAuditFixtures();
        Storage::fake('local');
        $this->service = app(AttendanceCorrectionService::class);
        $this->actingAs(User::findOrFail($this->f['admin']));

        $this->billingRule = $this->insert('finance.fee_rules', ['rule_type' => 'BILLING', 'method' => 'PER_MEETING', 'name' => 'Les reguler',
            'amount' => 100000, 'counted_statuses' => '["HADIR"]', 'is_active' => true, 'effective_from' => '2026-01-01']);
        $this->insert('finance.fee_rules', ['rule_type' => 'PAYROLL', 'method' => 'PER_MEETING', 'name' => 'Honor reguler',
            'amount' => 50000, 'counted_statuses' => '["HADIR"]', 'is_active' => true, 'effective_from' => '2026-01-01']);

        $this->session2 = $this->addSession('2026-10-12', 'ALPA');
        // Tagihan fixture (tanpa item) diganti tagihan asli dari generate bulanan
        DB::table('finance.invoices')->delete();
        app(InvoiceService::class)->generateMonthly(2026, 10, '2026-10-30');
        $this->invoice = Invoice::where('student_id', $this->f['sA'])->sole();
    }

    private function addSession(string $date, string $studentStatus, string $student = 'sA'): string {
        $session = $this->insert('academic.schedule_sessions', [
            'schedule_id' => $this->f['schA'], 'subject_id' => $this->f['subject'], 'tentor_id' => $this->f['tA'],
            'day_of_week' => 1, 'meeting_no' => ++$this->meetingNo, 'session_date' => $date, 'start_time' => '15:00', 'end_time' => '16:30', 'status' => 'COMPLETED',
        ]);
        $this->insert('academic.student_attendances', ['session_id' => $session, 'student_id' => $this->f[$student], 'attendance_status' => $studentStatus]);
        return $session;
    }

    private function request(string $session, string $newStatus, string $reason = 'Salah input oleh admin saat rekap'): AttendanceCorrection {
        return $this->service->request(ScheduleSession::findOrFail($session), $this->f['sA'], $newStatus, $reason);
    }

    private function approve(AttendanceCorrection $c, array $extra = [], ?UploadedFile $proof = null): AttendanceCorrection {
        return $this->service->approve($c, ['password' => self::PASSWORD, 'note' => 'Sudah dicek dengan jurnal kelas'] + $extra, $proof);
    }

    private function invoiceSnapshot(Invoice $invoice): array {
        return [$invoice->refresh()->only(['invoice_no', 'subtotal', 'discount', 'total_amount', 'period_month', 'period_year']),
            $invoice->items()->get()->map->only(['item_name', 'quantity', 'unit_price', 'subtotal'])->all()];
    }

    private function payTentorOctober(): \App\Models\Finance\Payroll {
        $this->insert('academic.tentor_attendances', ['session_id' => $this->f['ssA'], 'tentor_id' => $this->f['tA'], 'attendance_status' => 'HADIR', 'teaching_minutes' => 90]);
        $payroll = app(PayrollService::class)->generate(2026, 10);
        return app(PayrollService::class)->approve($payroll, self::PASSWORD, 'Sudah dicek terhadap absensi');
    }

    // Kunci

    public function test_at60_absensi_terkunci_setelah_tagihan_terbit_dengan_alasan(): void {
        $token = $this->tokenFor($this->f['admin']);
        $this->api('POST', "/admin/attendances/sessions/{$this->f['ssA']}/students", $token, ['attendances' => [['student_id' => $this->f['sA'], 'attendance_status' => 'ALPA']]])
            ->assertStatus(422)->assertJsonPath('locked', true);
        $this->api('GET', "/admin/attendances/sessions/{$this->f['ssA']}/students", $token)->assertOk()
            ->assertJsonPath('students.0.locked_reason', "tagihan {$this->invoice->invoice_no} periode ini sudah terbit");
    }

    public function test_at60_simpan_ulang_tanpa_perubahan_tetap_boleh(): void {
        $this->api('POST', "/admin/attendances/sessions/{$this->f['ssA']}/students", $this->tokenFor($this->f['admin']),
            ['attendances' => [['student_id' => $this->f['sA'], 'attendance_status' => 'HADIR']]])->assertOk();
    }

    public function test_at61_absensi_terkunci_karena_payroll_walau_tanpa_tagihan(): void {
        DB::table('finance.invoices')->delete();
        $this->payTentorOctober();

        $this->api('POST', "/admin/attendances/sessions/{$this->f['ssA']}/students", $this->tokenFor($this->f['admin']),
            ['attendances' => [['student_id' => $this->f['sA'], 'attendance_status' => 'ALPA']]])
            ->assertStatus(422)->assertJsonFragment(['locked' => true]);
    }

    public function test_at62_tagihan_dibatalkan_tidak_mengunci(): void {
        app(InvoiceService::class)->cancel($this->invoice, 'Salah kelas');
        $this->api('POST', "/admin/attendances/sessions/{$this->f['ssA']}/students", $this->tokenFor($this->f['admin']),
            ['attendances' => [['student_id' => $this->f['sA'], 'attendance_status' => 'ALPA']]])->assertOk();
    }

    // Pengajuan

    public function test_at63_koreksi_wajib_alasan_dan_absensi_harus_terkunci(): void {
        $token = $this->tokenFor($this->f['admin']);
        $this->api('POST', "/admin/attendances/sessions/{$this->f['ssA']}/corrections", $token, ['student_id' => $this->f['sA'], 'new_status' => 'ALPA', 'reason' => 'salah'])
            ->assertStatus(422)->assertJsonValidationErrors('reason');
        $this->api('POST', "/admin/attendances/sessions/{$this->f['ssB']}/corrections", $token, ['student_id' => $this->f['sA'], 'new_status' => 'ALPA', 'reason' => 'Bukan peserta kelas ini'])
            ->assertStatus(422);

        app(InvoiceService::class)->cancel($this->invoice, 'Salah kelas');
        $this->expectException(ValidationException::class);
        $this->request($this->f['ssA'], 'ALPA');
    }

    public function test_at63_persetujuan_sendiri_wajib_password_dan_alasan(): void {
        $correction = $this->request($this->f['ssA'], 'ALPA');

        foreach ([['note' => 'Sudah dicek dengan jurnal kelas'], ['password' => self::PASSWORD, 'note' => 'ok']] as $data) {
            try {
                $this->service->approve($correction, $data);
                $this->fail('Seharusnya ditolak');
            } catch (ValidationException) {
            }
        }
        $this->assertSame('PENDING', $correction->refresh()->status);
        $this->assertDatabaseHas('academic.student_attendances', ['session_id' => $this->f['ssA'], 'student_id' => $this->f['sA'], 'attendance_status' => 'HADIR']);
    }

    // Dampak tagihan

    public function test_at64_lebih_tagih_belum_dibayar_menjadi_kredit_tagihan_asli_tanpa_mengubah_histori(): void {
        $before = $this->invoiceSnapshot($this->invoice);
        $correction = $this->request($this->f['ssA'], 'ALPA');
        $this->assertEquals(-100000, $correction->financial_effect['billing']['delta']);

        $this->approve($correction);

        $this->assertSame($before, $this->invoiceSnapshot($this->invoice));
        $this->assertDatabaseHas('academic.student_attendances', ['session_id' => $this->f['ssA'], 'student_id' => $this->f['sA'], 'attendance_status' => 'ALPA']);
        $this->invoice->refresh();
        $this->assertEquals(100000, $this->invoice->paid_amount);
        $this->assertEquals(0, $this->invoice->remaining_amount);
        $this->assertSame('PAID', $this->invoice->status);
        $this->assertSame(['REQUESTED', 'APPROVED'], FinanceAuditLog::where('entity_id', $correction->id)->orderBy('created_at')->orderBy('id')->pluck('action')->all());
    }

    public function test_at65_at66_kurang_tagih_jadi_tagihan_penyesuaian_dengan_tarif_snapshot(): void {
        DB::table('finance.fee_rules')->where('id', $this->billingRule)->update(['amount' => 150000]); // tarif aktif naik
        $before = $this->invoiceSnapshot($this->invoice);

        $correction = $this->approve($this->request($this->session2, 'HADIR'));

        $adjustment = Invoice::where('invoice_type', 'ADJUSTMENT')->sole();
        $this->assertSame($this->invoice->id, $adjustment->adjusts_invoice_id);
        $this->assertEquals(100000, $adjustment->total_amount);      // tarif snapshot, bukan 150.000
        $this->assertNull($adjustment->period_month);
        $this->assertSame($adjustment->invoice_no, $correction->financial_effect['results']['adjustment_invoice_no']);
        $this->assertSame($before, $this->invoiceSnapshot($this->invoice));

        $result = app(InvoiceService::class)->generateMonthly(2026, 10, '2026-10-30');
        $this->assertSame(0, $result['created']);
        $this->assertSame(1, Invoice::where('invoice_type', 'REGULAR')->where('student_id', $this->f['sA'])->count());
    }

    public function test_at67_lebih_tagih_yang_sudah_dibayar_dikembalikan_dengan_bukti(): void {
        app(PaymentService::class)->recordByAdmin(['student_id' => $this->f['sA'], 'payment_date' => '2026-10-10', 'payment_method' => 'CASH',
            'allocations' => [['invoice_id' => $this->invoice->id, 'amount' => 100000]]]);
        $correction = $this->request($this->f['ssA'], 'ALPA');
        $this->assertEquals(100000, $correction->financial_effect['billing']['paid_portion']);

        $this->assertThrows(fn() => $this->approve($correction), ValidationException::class);                                   // pilihan wajib
        $this->assertThrows(fn() => $this->approve($correction, ['billing_resolution' => 'REFUND', 'refund_method' => 'CASH']), ValidationException::class); // bukti wajib

        $this->approve($correction, ['billing_resolution' => 'REFUND', 'refund_method' => 'TRANSFER', 'refund_reference_no' => 'RF-1'],
            UploadedFile::fake()->create('refund.pdf', 20, 'application/pdf'));

        $refund = Refund::sole();
        $this->assertEquals(100000, $refund->amount);
        Storage::disk('local')->assertExists($refund->proof_path);
        $this->assertSame('PAID', $this->invoice->refresh()->status);
    }

    public function test_at68_lebih_tagih_menjadi_kredit_yang_dipakai_tagihan_berikutnya_dan_sisanya_dibawa(): void {
        app(PaymentService::class)->recordByAdmin(['student_id' => $this->f['sA'], 'payment_date' => '2026-10-10', 'payment_method' => 'CASH',
            'allocations' => [['invoice_id' => $this->invoice->id, 'amount' => 100000]]]);
        $this->approve($this->request($this->f['ssA'], 'ALPA'), ['billing_resolution' => 'CREDIT']);
        $credit = CreditNote::where('remaining_amount', '>', 0)->sole();
        $this->assertEquals(100000, $credit->remaining_amount);

        $next = app(InvoiceService::class)->createManual(['student_id' => $this->f['sA'], 'class_id' => $this->f['cA'], 'due_date' => now()->addWeek()->toDateString(),
            'items' => [['item_name' => 'Modul', 'quantity' => 1, 'unit_price' => 75000]]]);

        $this->assertSame('PAID', $next->refresh()->status);
        $this->assertEquals(25000, $credit->refresh()->remaining_amount);
        $this->api('GET', "/parent/invoices/{$next->id}", $this->tokenFor($this->f['puA']))->assertOk()->assertJsonPath('data.credit_applied', 75000);
    }

    // Dampak honor

    public function test_payroll_draft_cukup_disusun_ulang(): void {
        DB::table('finance.invoices')->delete();
        $this->insert('academic.tentor_attendances', ['session_id' => $this->f['ssA'], 'tentor_id' => $this->f['tA'], 'attendance_status' => 'HADIR', 'teaching_minutes' => 90]);
        $payroll = app(PayrollService::class)->generate(2026, 10);

        $correction = $this->approve($this->request($this->f['ssA'], 'ALPA'));

        $this->assertStringContainsString('susun ulang', $correction->financial_effect['results']['payroll_note']);
        $this->assertSame(0, PayrollAdjustment::count());
        $this->assertEquals(0, app(PayrollService::class)->generate(2026, 10)->total_amount);
    }

    public function test_at69a_honor_lebih_bayar_dipotong_payroll_berikutnya_tanpa_negatif(): void {
        DB::table('finance.invoices')->delete();
        $october = $this->payTentorOctober();
        $correction = $this->request($this->f['ssA'], 'ALPA');
        $this->assertEquals(-50000, $correction->financial_effect['payroll']['delta']);

        $this->assertThrows(fn() => $this->approve($correction), ValidationException::class);   // pilihan wajib
        $this->approve($correction, ['payroll_resolution' => 'DEDUCT']);
        $this->assertSame($october->total_amount, $october->refresh()->total_amount);          // payroll lama tetap

        // November tanpa sesi: potongan belum bisa dipakai, dibawa
        $this->assertSame(0, app(PayrollService::class)->generate(2026, 11)->details()->count());
        $adjustment = PayrollAdjustment::sole();
        $this->assertSame(['DEDUCTION', 'OPEN'], [$adjustment->kind, $adjustment->status]);

        // Desember: satu sesi Rp 50.000, potongan Rp 50.000 → honor bersih 0, bukan negatif
        $dec = $this->addSession('2026-12-07', 'HADIR');
        $this->insert('academic.tentor_attendances', ['session_id' => $dec, 'tentor_id' => $this->f['tA'], 'attendance_status' => 'HADIR', 'teaching_minutes' => 90]);
        $payroll = app(PayrollService::class)->generate(2026, 12);
        $this->assertEquals(0, $payroll->total_amount);
        $this->assertSame('APPLIED', $adjustment->refresh()->status);
        $this->assertEquals(-50000, PayrollDetail::whereNotNull('adjustment_id')->sole()->subtotal);

        // Susun ulang mengembalikan & memakai lagi potongan yang sama (tidak ganda)
        $payroll = app(PayrollService::class)->generate(2026, 12);
        $this->assertSame(1, PayrollDetail::whereNotNull('adjustment_id')->count());
    }

    public function test_at69b_permintaan_pengembalian_honor_bisa_diubah_jadi_potongan(): void {
        DB::table('finance.invoices')->delete();
        $this->payTentorOctober();
        $this->approve($this->request($this->f['ssA'], 'ALPA'), ['payroll_resolution' => 'REFUND_REQUEST']);
        $adjustment = PayrollAdjustment::sole();
        $this->assertSame(['RECOVERY', 'OPEN'], [$adjustment->kind, $adjustment->status]);
        $token = $this->tokenFor($this->f['admin']);

        $this->api('GET', '/admin/finance/payroll-adjustments', $token)->assertOk()->assertJsonPath('data.0.kind', 'RECOVERY');
        $this->api('PATCH', "/admin/finance/payroll-adjustments/{$adjustment->id}/convert", $token, ['note' => 'Tentor minta dipotong saja'])->assertOk();
        $this->assertSame('DEDUCTION', $adjustment->refresh()->kind);
        $this->api('PATCH', "/admin/finance/payroll-adjustments/{$adjustment->id}/settle", $token, ['reference' => 'X'])->assertStatus(422);
    }

    public function test_at69b_pengembalian_honor_dicatat_selesai(): void {
        DB::table('finance.invoices')->delete();
        $this->payTentorOctober();
        $this->approve($this->request($this->f['ssA'], 'ALPA'), ['payroll_resolution' => 'REFUND_REQUEST']);

        $this->api('PATCH', '/admin/finance/payroll-adjustments/' . PayrollAdjustment::sole()->id . '/settle', $this->tokenFor($this->f['admin']), ['reference' => 'Tunai diterima 3/11'])->assertOk();
        $this->assertSame('SETTLED', PayrollAdjustment::sole()->status);
    }

    public function test_at69c_honor_kurang_bayar_ditambahkan_payroll_berikutnya(): void {
        DB::table('finance.invoices')->delete();
        // Sesi 12 Okt: siswa ALPA sehingga honor pertemuan Rp 0, lalu dikoreksi HADIR
        $this->insert('academic.tentor_attendances', ['session_id' => $this->session2, 'tentor_id' => $this->f['tA'], 'attendance_status' => 'HADIR', 'teaching_minutes' => 90]);
        $this->payTentorOctober();

        $correction = $this->approve($this->request($this->session2, 'HADIR'));
        $this->assertSame('ADDITION', $correction->financial_effect['results']['payroll_adjustment']['kind']);

        $november = app(PayrollService::class)->generate(2026, 11);
        $this->assertEquals(50000, $november->total_amount);
        $this->assertStringStartsWith('Penambah honor', PayrollDetail::whereNotNull('adjustment_id')->sole()->note);
    }

    public function test_orang_tua_dan_tentor_diberi_tahu(): void {
        Notification::fake();
        $this->payTentorOctober();
        $this->approve($this->request($this->f['ssA'], 'ALPA'), ['payroll_resolution' => 'DEDUCT']);

        Notification::assertSentTo(User::findOrFail($this->f['puA']), PortalNotification::class, fn($n) => $n->toArray($n)['kind'] === 'attendance_corrected');
        Notification::assertSentTo(User::findOrFail($this->f['tuA']), PortalNotification::class, fn($n) => $n->toArray($n)['kind'] === 'honor_adjusted');
    }

    public function test_endpoint_koreksi_alur_lengkap(): void {
        $token = $this->tokenFor($this->f['admin']);
        $id = $this->api('POST', "/admin/attendances/sessions/{$this->f['ssA']}/corrections", $token,
            ['student_id' => $this->f['sA'], 'new_status' => 'ALPA', 'reason' => 'Siswa ternyata tidak hadir', 'parent_request_note' => 'Orang tua konfirmasi via WA'])
            ->assertCreated()->assertJsonPath('data.financial_effect.billing.delta', -100000)->json('data.id');

        $this->api('POST', "/admin/attendances/sessions/{$this->f['ssA']}/corrections", $token,
            ['student_id' => $this->f['sA'], 'new_status' => 'IZIN', 'reason' => 'Pengajuan kedua kalinya'])->assertStatus(422);
        $this->api('GET', '/admin/attendances/corrections?status=PENDING', $token)->assertOk()->assertJsonPath('data.0.id', $id);
        $this->api('POST', "/admin/attendances/corrections/$id/approve", $token, ['password' => self::PASSWORD, 'note' => 'Sudah dicek dengan jurnal kelas'])
            ->assertOk()->assertJsonPath('data.status', 'APPROVED')->assertJsonPath('data.self_approved', true);
        $this->api('PATCH', "/admin/attendances/corrections/$id/reject", $token, ['note' => 'terlambat'])->assertStatus(422);
        $this->api('GET', '/admin/attendances/corrections', $this->tokenFor($this->f['tuA']))->assertStatus(403);
    }

    // Pengajuan oleh tentor, persetujuan oleh admin

    public function test_tentor_mengajukan_admin_menyetujui_tanpa_self_approval(): void {
        Notification::fake();
        $tentor = $this->tokenFor($this->f['tuA']);
        $id = $this->api('POST', "/tentor/sessions/{$this->f['ssA']}/attendance-corrections", $tentor,
            ['student_id' => $this->f['sA'], 'new_status' => 'ALPA', 'reason' => 'Siswa ternyata tidak hadir hari itu'])
            ->assertCreated()->assertJsonPath('data.status', 'PENDING')->assertJsonMissingPath('data.financial_effect')->json('data.id');

        Notification::assertSentTo(User::findOrFail($this->f['admin']), PortalNotification::class, fn($n) => $n->toArray($n)['kind'] === 'attendance_correction_requested');
        $this->api('GET', '/tentor/attendance-corrections', $tentor)->assertOk()->assertJsonPath('data.0.id', $id);

        $this->api('POST', "/admin/attendances/corrections/$id/approve", $this->tokenFor($this->f['admin']), ['password' => self::PASSWORD])
            ->assertOk()->assertJsonPath('data.status', 'APPROVED')->assertJsonPath('data.self_approved', false);
        Notification::assertSentTo(User::findOrFail($this->f['tuA']), PortalNotification::class, fn($n) => $n->toArray($n)['kind'] === 'attendance_correction_approved');
        $this->assertSame('ALPA', DB::table('academic.student_attendances')->where('session_id', $this->f['ssA'])->where('student_id', $this->f['sA'])->value('attendance_status'));
    }

    public function test_tentor_tidak_bisa_menyetujui_atau_melihat_antrean_admin(): void {
        $tentor = $this->tokenFor($this->f['tuA']);
        $id = $this->request($this->f['ssA'], 'ALPA')->id;
        $this->api('POST', "/admin/attendances/corrections/$id/approve", $tentor, [])->assertStatus(403);
        $this->api('PATCH', "/admin/attendances/corrections/$id/reject", $tentor, ['note' => 'tolak sendiri'])->assertStatus(403);
        $this->api('GET', '/tentor/attendance-corrections', $tentor)->assertOk()->assertJsonCount(0, 'data');
    }

    public function test_tentor_hanya_untuk_sesi_miliknya_dan_sudah_selesai(): void {
        $tentorA = $this->tokenFor($this->f['tuA']);
        $this->api('POST', "/tentor/sessions/{$this->f['ssB']}/attendance-corrections", $tentorA,
            ['student_id' => $this->f['sB'], 'new_status' => 'ALPA', 'reason' => 'Bukan sesi milik tentor A'])->assertStatus(403);

        DB::table('academic.schedule_sessions')->where('id', $this->f['ssA'])->update(['status' => 'IN_PROGRESS']);
        $this->api('POST', "/tentor/sessions/{$this->f['ssA']}/attendance-corrections", $tentorA,
            ['student_id' => $this->f['sA'], 'new_status' => 'ALPA', 'reason' => 'Sesi masih berjalan'])->assertStatus(422);

        $this->api('POST', "/tentor/sessions/tidak-valid/attendance-corrections", $tentorA,
            ['student_id' => $this->f['sA'], 'new_status' => 'ALPA', 'reason' => 'ID sesi tidak valid'])->assertStatus(404);
    }

    public function test_tentor_bisa_mengajukan_untuk_absensi_belum_terkunci_dan_alasan_wajib(): void {
        DB::table('finance.invoices')->delete();
        $tentor = $this->tokenFor($this->f['tuA']);
        $this->api('POST', "/tentor/sessions/{$this->f['ssA']}/attendance-corrections", $tentor,
            ['student_id' => $this->f['sA'], 'new_status' => 'ALPA', 'reason' => 'pendek'])->assertStatus(422);
        $this->api('POST', "/tentor/sessions/{$this->f['ssA']}/attendance-corrections", $tentor,
            ['student_id' => $this->f['sA'], 'new_status' => 'ALPA', 'reason' => 'Salah tekan tombol saat mengisi absensi'])->assertCreated();
    }

    public function test_tentor_ditolak_admin_dan_absensi_tidak_berubah(): void {
        Notification::fake();
        $id = $this->api('POST', "/tentor/sessions/{$this->f['ssA']}/attendance-corrections", $this->tokenFor($this->f['tuA']),
            ['student_id' => $this->f['sA'], 'new_status' => 'ALPA', 'reason' => 'Siswa ternyata tidak hadir hari itu'])->json('data.id');
        $this->api('PATCH', "/admin/attendances/corrections/$id/reject", $this->tokenFor($this->f['admin']), ['note' => 'Jurnal menunjukkan hadir'])->assertOk();

        $this->assertSame('HADIR', DB::table('academic.student_attendances')->where('session_id', $this->f['ssA'])->where('student_id', $this->f['sA'])->value('attendance_status'));
        Notification::assertSentTo(User::findOrFail($this->f['tuA']), PortalNotification::class, fn($n) => $n->toArray($n)['kind'] === 'attendance_correction_rejected');
    }
}
