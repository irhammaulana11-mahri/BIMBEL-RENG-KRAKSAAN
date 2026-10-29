<?php

namespace Tests\Feature\Security;

use Illuminate\Support\Facades\DB;
use Tests\Concerns\BuildsAuditFixtures;
use Tests\TestCase;

/**
 * Login, masa berlaku token, dan akun nonaktif (SEC-01, SEC-02, SEC-04 / keputusan D-06, D-07).
 */
class AccountLifecycleTest extends TestCase
{
    use BuildsAuditFixtures;

    protected function setUp(): void {
        parent::setUp();
        $this->buildAuditFixtures();
    }

    public function test_at09_admin_aktif_bisa_login(): void {
        $this->login('admin@uji.test')->assertOk()->assertJsonStructure(['token', 'expires_at']);
    }

    public function test_at04_pesan_gagal_sama_untuk_email_terdaftar_dan_tidak(): void {
        $known = $this->login('admin@uji.test', 'salah', '10.0.1.1');
        $unknown = $this->login('tidak-ada@uji.test', 'salah', '10.0.1.2');

        $this->assertSame($known->status(), $unknown->status());
        $this->assertSame($known->json('message'), $unknown->json('message'));
    }

    // D-07 — batas login gagal

    public function test_at01_lima_gagal_per_email_dan_ip_lalu_429(): void {
        for ($i = 0; $i < 5; $i++) {
            $this->login('admin@uji.test', "salah$i", '10.0.0.66')->assertStatus(401);
        }

        $this->login('admin@uji.test', self::PASSWORD, '10.0.0.66')
            ->assertStatus(429)
            ->assertHeader('Retry-After')
            ->assertJsonPath('success', false)
            ->assertJsonStructure(['message', 'retry_after']);
    }

    public function test_at01_email_berbeda_huruf_besar_dihitung_sama(): void {
        for ($i = 0; $i < 5; $i++) {
            $this->login($i % 2 ? 'ADMIN@uji.test' : ' admin@uji.test ', "salah$i", '10.0.0.66');
        }

        $this->login('admin@uji.test', self::PASSWORD, '10.0.0.66')->assertStatus(429);
    }

    public function test_at02_kunci_hanya_untuk_kombinasi_email_dan_ip(): void {
        for ($i = 0; $i < 5; $i++) {
            $this->login('admin@uji.test', "salah$i", '10.0.0.66');
        }

        // Email sama dari IP lain, dan pengguna lain dari IP (wifi) yang sama, tidak ikut terkunci
        $this->login('admin@uji.test', self::PASSWORD, '10.0.0.77')->assertOk();
        $this->login('tentorA@uji.test', self::PASSWORD, '10.0.0.66')->assertOk();
    }

    public function test_at03_kunci_lepas_setelah_satu_menit_dan_login_sukses_mereset_hitungan(): void {
        for ($i = 0; $i < 5; $i++) {
            $this->login('admin@uji.test', "salah$i", '10.0.0.66');
        }
        $this->login('admin@uji.test', self::PASSWORD, '10.0.0.66')->assertStatus(429);

        $this->travel(61)->seconds();
        $this->login('admin@uji.test', self::PASSWORD, '10.0.0.66')->assertOk();

        // Hitungan mulai dari nol lagi: empat gagal belum mengunci
        for ($i = 0; $i < 4; $i++) {
            $this->login('admin@uji.test', "salah$i", '10.0.0.66');
        }
        $this->login('admin@uji.test', self::PASSWORD, '10.0.0.66')->assertOk();
    }

    // D-06 — masa berlaku token

    public function test_at05_token_lebih_dari_12_jam_ditolak(): void {
        $token = $this->tokenFor($this->f['tuA']);

        $this->travel(719)->minutes();
        $this->api('GET', '/tentor/honor', $token)->assertOk();

        $this->travel(2)->minutes();
        $this->api('GET', '/tentor/honor', $token)->assertStatus(401);
    }

    public function test_at05_token_dari_login_menyimpan_expires_at_12_jam(): void {
        $this->freezeSecond();
        $res = $this->login('tentorA@uji.test')->assertOk();

        $this->assertSame(now()->addHours(12)->toIso8601String(), $res->json('expires_at'));
        $this->api('GET', '/tentor/honor', $res->json('token'))->assertOk();
    }

    // SEC-02 — akun nonaktif

    public function test_at06_tentor_nonaktif_token_lama_ditolak(): void {
        $token = $this->tokenFor($this->f['tuB']);
        $this->api('GET', '/tentor/honor', $token)->assertOk();

        $this->api('PATCH', "/admin/tentors/{$this->f['tB']}/toggle", $this->tokenFor($this->f['admin']))->assertSuccessful();

        $this->api('GET', '/tentor/honor', $token)->assertStatus(401);
        $this->login('tentorB@uji.test')->assertStatus(401);
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $this->f['tuB']]);
    }

    public function test_at07_siswa_nonaktif_token_lama_dan_login_baru_ditolak(): void {
        $token = $this->tokenFor($this->f['suB']);
        $this->api('GET', '/student/exams', $token)->assertOk();

        $this->api('PATCH', "/admin/students/{$this->f['sB']}/toggle", $this->tokenFor($this->f['admin']))->assertOk();

        $this->api('GET', '/student/exams', $token)->assertStatus(401);
        $this->login('siswaB@uji.test')->assertStatus(401)->assertJsonPath('success', false);
        $this->assertDatabaseMissing('personal_access_tokens', ['tokenable_id' => $this->f['suB']]);
    }

    public function test_at07_siswa_diaktifkan_lagi_bisa_login(): void {
        $admin = $this->tokenFor($this->f['admin']);
        $this->api('PATCH', "/admin/students/{$this->f['sB']}/toggle", $admin)->assertOk();
        $this->api('PATCH', "/admin/students/{$this->f['sB']}/toggle", $admin)->assertOk();

        $this->login('siswaB@uji.test')->assertOk();
    }

    /** Pemeriksaan per permintaan tetap menolak walau profil dinonaktifkan lewat jalur lain (tanpa cabut token). */
    public function test_at07_profil_nonaktif_tanpa_pencabutan_token_tetap_ditolak(): void {
        $student = $this->tokenFor($this->f['suA']);
        $tentor = $this->tokenFor($this->f['tuA']);
        DB::table('master.students')->where('id', $this->f['sA'])->update(['is_active' => false]);
        DB::table('master.tentors')->where('id', $this->f['tA'])->update(['is_active' => false]);

        $this->api('GET', '/student/exams', $student)->assertStatus(401);
        $this->api('GET', '/tentor/honor', $tentor)->assertStatus(401);
    }

    public function test_at08_orang_tua_nonaktif_token_lama_dan_login_ditolak(): void {
        $token = $this->tokenFor($this->f['puB']);
        $this->api('GET', '/parent/invoices', $token)->assertOk();

        $this->api('PATCH', "/admin/users/{$this->f['puB']}/toggle", $this->tokenFor($this->f['super']))->assertOk();

        $this->api('GET', '/parent/invoices', $token)->assertStatus(401);
        $this->login('ortuB@uji.test')->assertStatus(401);
    }

    public function test_at08_akun_nonaktif_ditolak_walau_token_belum_dicabut(): void {
        $token = $this->tokenFor($this->f['puA']);
        DB::table('master.users')->where('id', $this->f['puA'])->update(['is_active' => false]);

        $this->api('GET', '/parent/invoices', $token)->assertStatus(401);
    }
}
