<?php

namespace Tests\Feature\Finance;

use App\Models\Admin\User;
use App\Models\Finance\Payroll;
use App\Models\Finance\PayrollDetail;
use App\Models\Finance\PayrollException;
use App\Models\Finance\PayrollTransfer;
use App\Notifications\PortalNotification;
use App\Services\Finance\PayrollService;
use App\Services\Finance\SelfApprovalReport;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Tests\Concerns\BuildsAuditFixtures;
use Tests\TestCase;

/**
 * Payroll: pemisahan tugas / operator tunggal (D-03, D-11), pengecualian sesi tertunda (D-05),
 * bukti transfer wajib, konfirmasi terima oleh tentor, dan laporan persetujuan sendiri.
 */
class PayrollControlTest extends TestCase
{
    use BuildsAuditFixtures;

    private PayrollService $service;

    protected function setUp(): void {
        parent::setUp();
        $this->buildAuditFixtures();
        Storage::fake(PayrollService::PROOF_DISK);
        $this->service = app(PayrollService::class);
        $this->insert('finance.fee_rules', [
            'rule_type' => 'PAYROLL', 'method' => 'PER_MEETING', 'name' => 'Honor uji', 'amount' => 50000,
            'is_active' => true, 'effective_from' => '2026-01-01',
        ]);
        // Absensi tentor A pada sesi 5 Okt (periode Oktober)
        $this->f['attOct'] = $this->insert('academic.tentor_attendances', ['session_id' => $this->f['ssA'], 'tentor_id' => $this->f['tA'], 'attendance_status' => 'HADIR', 'teaching_minutes' => 90]);
    }

    private function as(string $userKey): void {
        $this->actingAs(User::findOrFail($this->f[$userKey]));
    }

    /** Sesi + absensi HADIR tentor A pada tanggal tertentu */
    private function lateSession(string $date): array {
        $session = $this->insert('academic.schedule_sessions', [
            'schedule_id' => $this->f['schA'], 'subject_id' => $this->f['subject'], 'tentor_id' => $this->f['tA'],
            'day_of_week' => 1, 'meeting_no' => 9, 'session_date' => $date, 'start_time' => '15:00', 'end_time' => '16:30', 'status' => 'COMPLETED',
        ]);
        $attendance = $this->insert('academic.tentor_attendances', ['session_id' => $session, 'tentor_id' => $this->f['tA'], 'attendance_status' => 'HADIR', 'teaching_minutes' => 90]);
        return [$session, $attendance];
    }

    private function proof(): UploadedFile {
        return UploadedFile::fake()->create('bukti.pdf', 20, 'application/pdf');
    }

    private function approvedPayroll(): Payroll {
        $this->as('admin');
        $payroll = $this->service->generate(2026, 10);
        return $this->service->approve($payroll, self::PASSWORD, 'Sudah dicek terhadap absensi');
    }

    // D-05 — sesi tertunda

    public function test_at55_sesi_bulan_lalu_tidak_masuk_otomatis_dan_menjadi_pengecualian(): void {
        [, $septAttendance] = $this->lateSession('2026-09-21');
        $this->as('admin');

        $payroll = $this->service->generate(2026, 10);

        $this->assertSame(1, $payroll->details()->count());
        $this->assertDatabaseMissing('finance.payroll_details', ['tentor_attendance_id' => $septAttendance]);
        $exception = PayrollException::where('tentor_attendance_id', $septAttendance)->sole();
        $this->assertSame('OPEN', $exception->status);
        $this->assertSame([2026, 9], [$exception->origin_year, $exception->origin_month]);
        $this->assertTrue($exception->checksPassed());
        $this->assertEqualsCanonicalizing(['session_completed', 'attendance_present', 'not_paid', 'rate', 'origin_period'], collect($exception->checks)->pluck('key')->all());
    }

    public function test_at56_pengecualian_disetujui_ikut_payroll_berikutnya_sebagai_susulan_tanpa_ganda(): void {
        [, $septAttendance] = $this->lateSession('2026-09-21');
        $this->as('admin');
        $this->service->syncExceptions(2026, 10);
        $exception = PayrollException::sole();

        $this->service->approveException($exception, self::PASSWORD, null);
        $payroll = $this->service->generate(2026, 10);
        $this->service->generate(2026, 10);

        $line = PayrollDetail::where('tentor_attendance_id', $septAttendance)->sole();
        $this->assertSame($payroll->id, $line->payroll_id);
        $this->assertStringStartsWith('Susulan September 2026', $line->note);
        $this->assertSame($payroll->id, $exception->refresh()->target_payroll_id);
        $this->assertSame(2, $payroll->refresh()->details()->count());
    }

    public function test_at57_pengecualian_untuk_sesi_yang_sudah_dibayar_tidak_bisa_disetujui(): void {
        [$session, $septAttendance] = $this->lateSession('2026-09-21');
        // Data tidak konsisten: sesi sudah ada di payroll lain, tetapi absensinya tercatat belum diproses
        $other = $this->insert('finance.payrolls', ['payroll_no' => 'PRL-202609', 'period_month' => 9, 'period_year' => 2026, 'payroll_date' => '2026-09-30',
            'total_tutors' => 1, 'total_sessions' => 1, 'total_teaching_minutes' => 90, 'total_amount' => 50000, 'status' => 'PAID']);
        $this->insert('finance.payroll_details', ['payroll_id' => $other, 'tentor_id' => $this->f['tA'], 'session_id' => $session, 'teaching_minutes' => 90,
            'rate_per_session' => 50000, 'rate_per_hour' => 0, 'subtotal' => 50000, 'quantity' => 1, 'unit_amount' => 50000]);
        $this->as('admin');
        $this->service->syncExceptions(2026, 10);
        $exception = PayrollException::where('tentor_attendance_id', $septAttendance)->sole();

        $this->assertFalse($exception->checksPassed());
        $this->expectException(ValidationException::class);
        $this->service->approveException($exception, self::PASSWORD, null);
    }

    public function test_at58_pengecualian_ditolak_tidak_pernah_dibayar(): void {
        [, $septAttendance] = $this->lateSession('2026-09-21');
        $this->as('admin');
        $this->service->syncExceptions(2026, 10);
        $this->service->rejectException(PayrollException::sole(), 'Tentor tidak hadir, salah input');

        $this->service->generate(2026, 10);
        $this->service->generate(2026, 11);

        $this->assertDatabaseMissing('finance.payroll_details', ['tentor_attendance_id' => $septAttendance]);
        $this->assertSame(1, PayrollException::count());
    }

    public function test_at55_endpoint_pengecualian_dan_peninjauannya(): void {
        $this->lateSession('2026-09-21');
        $token = $this->tokenFor($this->f['admin']);

        $this->api('GET', '/admin/finance/payrolls/preview?period=2026-10', $token)->assertOk()->assertJsonPath('open_exceptions', 1);
        $id = $this->api('GET', '/admin/finance/payroll-exceptions', $token)->assertOk()
            ->assertJsonPath('data.0.status', 'OPEN')->assertJsonPath('data.0.origin_label', 'September 2026')
            ->assertJsonPath('data.0.checks_passed', true)->json('data.0.id');

        $this->api('PATCH', "/admin/finance/payroll-exceptions/$id/approve", $token, [])->assertStatus(422)->assertJsonValidationErrors('password');
        $this->api('PATCH', "/admin/finance/payroll-exceptions/$id/approve", $token, ['password' => self::PASSWORD])->assertOk()
            ->assertJsonPath('data.status', 'APPROVED');
    }

    public function test_pratinjau_tentor_tidak_membuat_pengecualian(): void {
        $this->lateSession('2026-09-21');
        $this->api('GET', '/tentor/honor', $this->tokenFor($this->f['tuA']))->assertOk();
        $this->assertSame(0, PayrollException::count());
    }

    public function test_database_menolak_absensi_yang_dibayar_di_dua_payroll(): void {
        $this->as('admin');
        $this->service->generate(2026, 10);
        $other = $this->insert('finance.payrolls', ['payroll_no' => 'PRL-X', 'period_month' => 11, 'period_year' => 2026, 'payroll_date' => '2026-11-30',
            'total_tutors' => 1, 'total_sessions' => 1, 'total_teaching_minutes' => 90, 'total_amount' => 50000, 'status' => 'DRAFT']);

        $this->expectException(UniqueConstraintViolationException::class);
        DB::transaction(fn() => $this->insert('finance.payroll_details', ['payroll_id' => $other, 'tentor_id' => $this->f['tA'], 'tentor_attendance_id' => $this->f['attOct'],
            'teaching_minutes' => 90, 'rate_per_session' => 1, 'rate_per_hour' => 0, 'subtotal' => 1, 'quantity' => 1, 'unit_amount' => 1]));
    }

    // D-11 — mode operator tunggal

    public function test_at59a_persetujuan_payroll_sendiri_wajib_password_dan_alasan(): void {
        $this->as('admin');
        $payroll = $this->service->generate(2026, 10);

        foreach ([[null, 'Sudah dicek terhadap absensi'], ['salah', 'Sudah dicek terhadap absensi'], [self::PASSWORD, 'ok']] as [$password, $note]) {
            try {
                $this->service->approve($payroll, $password, $note);
                $this->fail('Seharusnya ditolak');
            } catch (ValidationException) {
            }
        }
        $this->assertSame('DRAFT', $payroll->refresh()->status);

        $payroll = $this->service->approve($payroll, self::PASSWORD, 'Sudah dicek terhadap absensi');
        $this->assertSame('APPROVED', $payroll->status);
        $this->assertTrue($payroll->self_approved);
        $this->assertSame($this->f['admin'], $payroll->generated_by);
    }

    public function test_at59b_transfer_wajib_nomor_referensi_dan_berkas_bukti(): void {
        $payroll = $this->approvedPayroll();
        $token = $this->tokenFor($this->f['admin']);
        $base = ['tentor_id' => $this->f['tA'], 'transfer_date' => now()->toDateString(), 'password' => self::PASSWORD, 'approval_note' => 'Transfer BCA ke rekening tentor'];

        $this->api('POST', "/admin/finance/payrolls/{$payroll->id}/transfers", $token, $base + ['proof' => $this->proof()])
            ->assertStatus(422)->assertJsonValidationErrors('reference_no');
        $this->api('POST', "/admin/finance/payrolls/{$payroll->id}/transfers", $token, $base + ['reference_no' => 'TRF-1'])
            ->assertStatus(422)->assertJsonValidationErrors('proof');
        $this->api('POST', "/admin/finance/payrolls/{$payroll->id}/transfers", $token, $base + ['reference_no' => 'TRF-1', 'proof' => $this->proof()])
            ->assertOk();

        $transfer = PayrollTransfer::sole();
        $this->assertTrue($transfer->self_approved);
        Storage::disk(PayrollService::PROOF_DISK)->assertExists($transfer->proof_path);
        $this->api('GET', "/admin/finance/payrolls/{$payroll->id}/transfers/{$transfer->id}/proof", $token)->assertOk();
        $this->api('GET', "/tentor/honor/{$payroll->id}/transfer-proof", $this->tokenFor($this->f['tuA']))->assertOk();
    }

    public function test_at59b_transfer_ditolak_tidak_menyimpan_berkas(): void {
        $payroll = $this->approvedPayroll();
        try {
            $this->service->transfer($payroll, $this->f['tA'], ['transfer_date' => now()->toDateString(), 'reference_no' => 'TRF-1', 'password' => 'salah'], $this->proof());
        } catch (ValidationException) {
        }
        $this->assertEmpty(Storage::disk(PayrollService::PROOF_DISK)->allFiles());
    }

    public function test_at59c_tentor_mengonfirmasi_atau_melaporkan_masalah_transfer(): void {
        Notification::fake();
        $payroll = $this->approvedPayroll();
        $this->service->transfer($payroll, $this->f['tA'], ['transfer_date' => now()->toDateString(), 'reference_no' => 'TRF-1', 'password' => self::PASSWORD, 'approval_note' => 'Transfer BCA ke rekening tentor'], $this->proof());
        Notification::assertSentTo(User::findOrFail($this->f['tuA']), PortalNotification::class);
        $tentor = $this->tokenFor($this->f['tuA']);

        $this->api('POST', "/tentor/honor/{$payroll->id}/receipt", $this->tokenFor($this->f['tuB']), ['status' => 'RECEIVED'])->assertStatus(404);
        $this->api('POST', "/tentor/honor/{$payroll->id}/receipt", $tentor, ['status' => 'DISPUTED'])->assertStatus(422);
        $this->api('POST', "/tentor/honor/{$payroll->id}/receipt", $tentor, ['status' => 'DISPUTED', 'note' => 'Belum masuk rekening'])->assertOk();
        Notification::assertSentTo(User::findOrFail($this->f['admin']), PortalNotification::class, fn($n) => $n->toArray($n)['kind'] === 'honor_disputed');

        $this->api('POST', "/tentor/honor/{$payroll->id}/receipt", $tentor, ['status' => 'RECEIVED'])->assertOk();
        $this->api('POST', "/tentor/honor/{$payroll->id}/receipt", $tentor, ['status' => 'DISPUTED', 'note' => 'Berubah pikiran'])->assertStatus(422);

        $this->api('GET', '/tentor/honor', $tentor)->assertOk()->assertJsonPath('data.history.0.transfer.receipt_status', 'RECEIVED');
        $this->assertSame(['RECEIPT_DISPUTED', 'RECEIPT_CONFIRMED'], \App\Models\Finance\FinanceAuditLog::where('entity_type', 'payroll_transfer')
            ->where('action', 'like', 'RECEIPT_%')->orderBy('created_at')->orderBy('id')->pluck('action')->all());
    }

    public function test_at59d_laporan_memuat_tepat_aksi_yang_disetujui_sendiri_bulan_itu(): void {
        $payroll = $this->approvedPayroll(); // disetujui sendiri oleh admin
        $this->service->transfer($payroll, $this->f['tA'], ['transfer_date' => now()->toDateString(), 'reference_no' => 'TRF-9', 'password' => self::PASSWORD, 'approval_note' => 'Transfer BCA ke rekening tentor'], $this->proof());
        // Pengecualian disetujui tanpa tahap sebelumnya oleh akun yang sama: bukan persetujuan sendiri
        $this->lateSession('2026-09-21');
        $this->service->syncExceptions(2026, 11);
        $this->service->approveException(PayrollException::sole(), self::PASSWORD, null);

        $report = app(SelfApprovalReport::class)->build(2026, 10);

        $this->assertSame(['Persetujuan payroll', 'Transfer honor'], $report['actions']->pluck('type')->all());
        $this->assertSame(1, $report['summary']['unconfirmed']);
        $this->assertSame(0, app(SelfApprovalReport::class)->build(2026, 9)['summary']['self_approved']);

        $res = $this->api('GET', '/admin/finance/reports/self-approvals?period=2026-10', $this->tokenFor($this->f['admin']))->assertOk();
        $this->assertStringStartsWith('%PDF', $res->getContent());
        $this->assertDatabaseHas('logs.activity_logs', ['activity' => 'Mengunduh laporan persetujuan sendiri periode 2026-10']);
    }

    // D-03 — mode terpisah (belum aktif, disiapkan untuk bila ada orang kedua)

    public function test_at59e_mode_terpisah_tiga_akun_berbeda(): void {
        config(['finance.approval_mode' => 'separated']);
        $this->f['admin3'] = $this->makeUser('Admin Tiga', 'admin3@uji.test', 'admin');

        $this->as('admin');
        $payroll = $this->service->generate(2026, 10);
        $this->assertThrows(fn() => $this->service->approve($payroll), ValidationException::class);           // AT-50

        $this->as('super');
        $payroll = $this->service->approve($payroll);
        $this->assertFalse($payroll->self_approved);

        $transfer = fn() => $this->service->transfer($payroll, $this->f['tA'], ['transfer_date' => now()->toDateString(), 'reference_no' => 'TRF-1'], $this->proof());
        $this->assertThrows($transfer, ValidationException::class);                                             // penyetuju
        $this->as('admin');
        $this->assertThrows($transfer, ValidationException::class);                                             // penyusun
        $this->as('admin3');
        $transfer();                                                                                             // AT-51
        $this->assertSame('PAID', $payroll->refresh()->status);
    }

    public function test_at53_penyusun_ulang_menjadi_penyusun_yang_dicek(): void {
        config(['finance.approval_mode' => 'separated']);
        $this->as('admin');
        $this->service->generate(2026, 10);
        $this->as('super');
        $payroll = $this->service->generate(2026, 10);

        $this->assertSame($this->f['super'], $payroll->generated_by);
        $this->assertThrows(fn() => $this->service->approve($payroll), ValidationException::class);
        $this->as('admin');
        $this->assertSame('APPROVED', $this->service->approve($payroll)->status);
    }
}
