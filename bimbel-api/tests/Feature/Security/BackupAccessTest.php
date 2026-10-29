<?php

namespace Tests\Feature\Security;

use App\Services\System\BackupService;
use Illuminate\Support\Facades\Route;
use PHPUnit\Framework\Attributes\Group;
use Tests\Concerns\BuildsAuditFixtures;
use Tests\TestCase;

/**
 * Backup & pemulihan hanya untuk super admin (keputusan D-04).
 */
class BackupAccessTest extends TestCase
{
    use BuildsAuditFixtures;

    protected function setUp(): void {
        parent::setUp();
        $this->buildAuditFixtures();
    }

    public function test_at21_super_admin_bisa_membuka_daftar_backup(): void {
        $this->api('GET', '/admin/backups', $this->tokenFor($this->f['super']))->assertOk();
    }

    /**
     * Semua route di bawah admin/backups, diambil dari daftar route (bukan sampel).
     * Parameter {backup} diisi UUID acak: penolakan peran harus terjadi sebelum model dicari.
     */
    #[Group('temuan-terbuka'), Group('D-04')]
    public function test_at20_admin_biasa_ditolak_di_semua_route_backup(): void {
        // Selama admin masih lolos, jangan sampai test benar-benar membuat/memulihkan/menghapus backup:
        // selain pengecekan kunci restore, setiap pemanggilan service gagal tanpa efek samping.
        $this->mock(BackupService::class, fn($m) => $m->shouldReceive('restoreInProgress')->andReturnNull());
        $token = $this->tokenFor($this->f['admin']);
        $routes = collect(Route::getRoutes()->getRoutes())->filter(fn($r) => str_starts_with($r->uri(), 'api/admin/backups'));
        $this->assertNotEmpty($routes);

        foreach ($routes as $route) {
            $uri = substr(str_replace('{backup}', '00000000-0000-7000-8000-000000000000', $route->uri()), 3);
            foreach (array_diff($route->methods(), ['HEAD']) as $method) {
                $status = $this->api($method, $uri, $token)->status();
                $this->assertSame(403, $status, "$method $uri seharusnya 403 untuk admin, dapat $status");
            }
        }
    }
}
