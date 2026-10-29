<?php

namespace Tests\Feature\Security;

use PHPUnit\Framework\Attributes\Group;
use Tests\Concerns\BuildsAuditFixtures;
use Tests\TestCase;

/**
 * Login, masa berlaku token, dan akun nonaktif (SEC-01, SEC-02, SEC-04 / keputusan D-06, D-07).
 * Test bergrup `temuan-terbuka` menegaskan perilaku yang DIINGINKAN dan diperkirakan gagal
 * sampai tahap perbaikannya (T2) selesai.
 */
class AccountLifecycleTest extends TestCase
{
    use BuildsAuditFixtures;

    protected function setUp(): void {
        parent::setUp();
        $this->buildAuditFixtures();
    }

    public function test_at09_admin_aktif_bisa_login(): void {
        $this->login('admin@uji.test')->assertOk()->assertJsonStructure(['token']);
    }

    public function test_at04_pesan_gagal_sama_untuk_email_terdaftar_dan_tidak(): void {
        $known = $this->login('admin@uji.test', 'salah', '10.0.1.1');
        $unknown = $this->login('tidak-ada@uji.test', 'salah', '10.0.1.2');

        $this->assertSame($known->status(), $unknown->status());
        $this->assertSame($known->json('message'), $unknown->json('message'));
    }

    #[Group('temuan-terbuka'), Group('SEC-01')]
    public function test_at01_lima_gagal_per_email_dan_ip_lalu_429(): void {
        for ($i = 0; $i < 5; $i++) {
            $this->login('admin@uji.test', "salah$i", '10.0.0.66');
        }

        $this->login('admin@uji.test', self::PASSWORD, '10.0.0.66')
            ->assertStatus(429)
            ->assertHeader('Retry-After');
    }

    #[Group('temuan-terbuka'), Group('SEC-04')]
    public function test_at05_token_lebih_dari_12_jam_ditolak(): void {
        $token = $this->tokenFor($this->f['tuA']);

        $this->travel(719)->minutes();
        $this->api('GET', '/tentor/honor', $token)->assertOk();

        $this->travel(2)->minutes();
        $this->api('GET', '/tentor/honor', $token)->assertStatus(401);
    }

    #[Group('temuan-terbuka'), Group('SEC-02')]
    public function test_at06_tentor_nonaktif_token_lama_ditolak(): void {
        $token = $this->tokenFor($this->f['tuB']);
        $this->api('GET', '/tentor/honor', $token)->assertOk();

        $this->api('PATCH', "/admin/tentors/{$this->f['tB']}/toggle", $this->tokenFor($this->f['admin']))->assertOk();

        $this->api('GET', '/tentor/honor', $token)->assertStatus(401);
        $this->login('tentorB@uji.test')->assertStatus(401);
    }

    #[Group('temuan-terbuka'), Group('SEC-02')]
    public function test_at07_siswa_nonaktif_token_lama_dan_login_baru_ditolak(): void {
        $token = $this->tokenFor($this->f['suB']);
        $this->api('GET', '/student/exams', $token)->assertOk();

        $this->api('PATCH', "/admin/students/{$this->f['sB']}/toggle", $this->tokenFor($this->f['admin']))->assertOk();

        $this->api('GET', '/student/exams', $token)->assertStatus(401);
        $this->login('siswaB@uji.test')->assertStatus(401);
    }
}
