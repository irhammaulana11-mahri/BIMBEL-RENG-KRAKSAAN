<?php

namespace Tests\Feature\Security;

use Illuminate\Support\Str;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Concerns\BuildsAuditFixtures;
use Tests\TestCase;

/**
 * Kontrol akses yang sudah terbukti baik saat audit (U, R, I, V). Harus tetap lulus di setiap tahap.
 */
class AccessControlTest extends TestCase
{
    use BuildsAuditFixtures;

    protected function setUp(): void {
        parent::setUp();
        $this->buildAuditFixtures();
    }

    // U — tanpa login / token palsu

    public function test_u1_tanpa_token_admin_ditolak(): void {
        $this->api('GET', '/admin/finance/invoices')->assertStatus(401);
    }

    public function test_u2_tanpa_token_portal_orang_tua_ditolak(): void {
        $this->api('GET', '/parent/invoices')->assertStatus(401);
    }

    public function test_u3_token_palsu_ditolak(): void {
        $this->api('GET', '/tentor/honor', '1|palsu')->assertStatus(401);
    }

    // R — peran salah

    public static function wrongRoles(): array {
        return [
            'R-1 orang tua ke backup'         => ['puA', '/admin/backups'],
            'R-2 tentor ke tagihan admin'     => ['tuA', '/admin/finance/invoices'],
            'R-3 siswa ke portal orang tua'   => ['suA', '/parent/invoices'],
            'R-4 orang tua ke honor tentor'   => ['puA', '/tentor/honor'],
        ];
    }

    #[DataProvider('wrongRoles')]
    public function test_r_peran_salah_ditolak(string $user, string $uri): void {
        $this->api('GET', $uri, $this->tokenFor($this->f[$user]))->assertStatus(403);
    }

    // I — akses data milik pengguna lain (IDOR)

    public function test_i1_orang_tua_tidak_bisa_membaca_tagihan_anak_lain(): void {
        $this->api('GET', "/parent/invoices/{$this->f['invB']}", $this->tokenFor($this->f['puA']))->assertStatus(404);
    }

    public function test_i2_orang_tua_tidak_bisa_mengunduh_pdf_tagihan_anak_lain(): void {
        $this->api('GET', "/parent/invoices/{$this->f['invB']}/pdf", $this->tokenFor($this->f['puA']))->assertStatus(404);
    }

    public function test_i3_orang_tua_tidak_bisa_membayar_tagihan_anak_lain(): void {
        $res = $this->api('POST', "/parent/invoices/{$this->f['invB']}/payments", $this->tokenFor($this->f['puA']), ['amount' => 1000, 'payment_date' => '2026-10-10']);
        $this->assertContains($res->status(), [404, 422]);
        $this->assertDatabaseCount('finance.payments', 0);
    }

    public function test_i4_orang_tua_tidak_bisa_mengajukan_pindah_jadwal_sesi_anak_lain(): void {
        $res = $this->api('POST', "/parent/sessions/{$this->f['ssB']}/reschedule-requests", $this->tokenFor($this->f['puA']), ['proposed_date' => '2026-11-20', 'proposed_start_time' => '15:00', 'reason' => 'uji']);
        $this->assertContains($res->status(), [404, 422]);
    }

    public function test_i5_tentor_tidak_bisa_membuka_sesi_tentor_lain(): void {
        $res = $this->api('GET', "/tentor/sessions/{$this->f['ssB']}/workspace", $this->tokenFor($this->f['tuA']));
        $this->assertContains($res->status(), [403, 404]);
    }

    public function test_i6_tentor_tidak_bisa_mengisi_absensi_sesi_tentor_lain(): void {
        $res = $this->api('POST', "/tentor/sessions/{$this->f['ssB']}/attendance", $this->tokenFor($this->f['tuA']), ['attendances' => [['student_id' => $this->f['sB'], 'attendance_status' => 'ALPA']]]);
        $this->assertContains($res->status(), [403, 404]);
        $this->assertDatabaseHas('academic.student_attendances', ['session_id' => $this->f['ssB'], 'attendance_status' => 'HADIR']);
    }

    public function test_i7_i8_i9_id_acak_tidak_ditemukan(): void {
        $id = (string) Str::uuid();
        $this->api('GET', "/parent/progress-reports/$id", $this->tokenFor($this->f['puA']))->assertStatus(404);
        $this->api('GET', "/student/exam-results/$id", $this->tokenFor($this->f['suA']))->assertStatus(404);
        $this->api('GET', "/tentor/honor/$id/slip", $this->tokenFor($this->f['tuA']))->assertStatus(404);
    }

    // V — input tidak valid

    public function test_v1_id_bukan_uuid_ditolak(): void {
        $res = $this->api('GET', '/tentor/sessions/abc/workspace', $this->tokenFor($this->f['tuA']));
        $this->assertContains($res->status(), [404, 422]);
    }

    public function test_v2_nominal_bayar_negatif_ditolak(): void {
        $this->api('POST', "/parent/invoices/{$this->f['invA']}/payments", $this->tokenFor($this->f['puA']), ['amount' => -5000, 'payment_date' => '2026-10-10'])
            ->assertStatus(422);
    }
}
