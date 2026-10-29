<?php

namespace Tests\Feature\Security;

use App\Models\System\Backup;
use App\Services\System\BackupService;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\Concerns\BuildsAuditFixtures;
use Tests\TestCase;

/**
 * Pengerasan T12: versi client PostgreSQL saat restore (SEC-06), ganti password admin (LOW-05),
 * CORS eksplisit (LOW-03).
 */
class HardeningTest extends TestCase
{
    use BuildsAuditFixtures;

    protected function setUp(): void {
        parent::setUp();
        $this->buildAuditFixtures();
    }

    // SEC-06

    public static function clientVersions(): array {
        return [
            'psql 16.15 (Ubuntu)'   => ['psql (PostgreSQL) 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)', true],
            'psql 16.10 tepat'      => ['psql (PostgreSQL) 16.10', true],
            'psql 16.9 rentan'      => ['psql (PostgreSQL) 16.9', false],
            'pg_restore 17.6'       => ['pg_restore (PostgreSQL) 17.6', true],
            'pg_restore 17.5'       => ['pg_restore (PostgreSQL) 17.5', false],
            'psql 15.14'            => ['psql (PostgreSQL) 15.14', true],
            'psql 14.18 rentan'     => ['psql (PostgreSQL) 14.18', false],
            'psql 13.22'            => ['psql (PostgreSQL) 13.22', true],
            'psql 12 tidak didukung'=> ['psql (PostgreSQL) 12.22', false],
            'psql 18'               => ['psql (PostgreSQL) 18.0', true],
            'keluaran tidak dikenal'=> ['command not found', false],
        ];
    }

    #[DataProvider('clientVersions')]
    public function test_sec06_versi_client_postgresql(string $output, bool $safe): void {
        $this->assertSame($safe, BackupService::isPatchedClient($output));
    }

    public function test_sec06_verifikasi_menolak_client_yang_belum_diperbarui(): void {
        // psql palsu yang melaporkan versi rentan
        $fake = storage_path('framework/testing/fake-psql');
        file_put_contents($fake, "#!/bin/sh\necho 'psql (PostgreSQL) 16.9'\n");
        chmod($fake, 0755);
        config(['backup.psql' => $fake]);

        $this->actingAs(\App\Models\Admin\User::findOrFail($this->f['super']));
        $backup = app(BackupService::class)->run(app(BackupService::class)->start('MANUAL', false, null));

        try {
            app(BackupService::class)->verify($backup);
            $this->fail('Verifikasi seharusnya menolak psql 16.9');
        } catch (\RuntimeException $e) {
            $this->assertStringContainsString('belum aman', $e->getMessage());
        } finally {
            @unlink($fake);
            @unlink($backup->path());
        }
    }

    // LOW-05

    public function test_low05_admin_bisa_mengganti_password_sendiri_dan_sesi_lain_keluar(): void {
        $other = $this->tokenFor($this->f['admin']);
        $current = $this->tokenFor($this->f['admin']);

        $this->api('PUT', '/admin/password', $current, ['current_password' => 'salah', 'password' => 'Rahasia-Baru-9', 'password_confirmation' => 'Rahasia-Baru-9'])
            ->assertStatus(422)->assertJsonValidationErrors('current_password');
        $this->api('PUT', '/admin/password', $current, ['current_password' => self::PASSWORD, 'password' => 'Rahasia-Baru-9', 'password_confirmation' => 'Rahasia-Baru-9'])
            ->assertOk();

        $this->api('GET', '/admin/dashboard', $other)->assertStatus(401);
        $this->api('GET', '/admin/dashboard', $current)->assertOk();
        $this->login('admin@uji.test', 'Rahasia-Baru-9')->assertOk();
    }

    public function test_low05_endpoint_password_admin_bukan_untuk_peran_lain(): void {
        $this->api('PUT', '/admin/password', $this->tokenFor($this->f['tuA']), ['current_password' => self::PASSWORD, 'password' => 'Rahasia-Baru-9', 'password_confirmation' => 'Rahasia-Baru-9'])
            ->assertStatus(403);
    }

    // LOW-03

    public function test_low03_cors_mengikuti_daftar_origin(): void {
        config(['cors.allowed_origins' => ['https://bimbel.example']]);

        $allowed = $this->withHeaders(['Origin' => 'https://bimbel.example', 'Access-Control-Request-Method' => 'GET'])->options('/api/website/articles');
        $this->assertSame('https://bimbel.example', $allowed->headers->get('Access-Control-Allow-Origin'));

        $other = $this->withHeaders(['Origin' => 'https://jahat.example', 'Access-Control-Request-Method' => 'GET'])->options('/api/website/articles');
        $this->assertNotSame('https://jahat.example', $other->headers->get('Access-Control-Allow-Origin'));
    }

    public function test_low03_nama_berkas_unduhan_terbaca_lintas_origin(): void {
        $res = $this->withHeaders(['Origin' => 'https://bimbel.example'])->get('/api/website/articles');
        $this->assertStringContainsString('Content-Disposition', (string) $res->headers->get('Access-Control-Expose-Headers'));
    }
}
