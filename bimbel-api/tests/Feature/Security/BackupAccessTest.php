<?php

namespace Tests\Feature\Security;

use App\Models\Admin\User;
use App\Notifications\PortalNotification;
use App\Services\System\BackupService;
use Database\Seeders\AdminUserSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Route;
use Tests\Concerns\BuildsAuditFixtures;
use Tests\TestCase;

/**
 * Backup & pemulihan hanya untuk super admin (D-04) dan akun super admin pertama dari seeder (D-12).
 */
class BackupAccessTest extends TestCase
{
    use BuildsAuditFixtures;

    protected function setUp(): void {
        parent::setUp();
        $this->buildAuditFixtures();
    }

    private function roleId(string $name): string {
        return DB::table('master.roles')->where('role_name', $name)->value('id');
    }

    public function test_at21_super_admin_bisa_membuka_daftar_backup(): void {
        $this->api('GET', '/admin/backups', $this->tokenFor($this->f['super']))->assertOk();
    }

    /**
     * Semua route di bawah admin/backups, diambil dari daftar route (bukan sampel).
     * Parameter {backup} diisi UUID acak: penolakan peran harus terjadi sebelum model dicari.
     */
    public function test_at20_admin_biasa_ditolak_di_semua_route_backup(): void {
        // Bila penolakan peran gagal, jangan sampai test benar-benar membuat/memulihkan/menghapus backup:
        // selain pengecekan kunci restore, setiap pemanggilan service gagal tanpa efek samping.
        $this->mock(BackupService::class, fn($m) => $m->shouldReceive('restoreInProgress')->andReturnNull());
        $token = $this->tokenFor($this->f['admin']);
        $routes = collect(Route::getRoutes()->getRoutes())->filter(fn($r) => str_starts_with($r->uri(), 'api/admin/backups'));
        $this->assertCount(9, $routes);

        foreach ($routes as $route) {
            $uri = substr(str_replace('{backup}', '00000000-0000-7000-8000-000000000000', $route->uri()), 3);
            foreach (array_diff($route->methods(), ['HEAD']) as $method) {
                $status = $this->api($method, $uri, $token)->status();
                $this->assertSame(403, $status, "$method $uri seharusnya 403 untuk admin, dapat $status");
            }
        }
    }

    public function test_at22_notifikasi_backup_hanya_untuk_super_admin(): void {
        Notification::fake();
        $notify = new \ReflectionMethod(BackupService::class, 'notifyAdmins');
        $notify->invoke(app(BackupService::class), 'info', 'Backup selesai', 'Uji');

        Notification::assertSentTo(User::findOrFail($this->f['super']), PortalNotification::class);
        Notification::assertNotSentTo(User::findOrFail($this->f['admin']), PortalNotification::class);
    }

    public function test_at23_seeder_membuat_super_admin_hanya_saat_belum_ada(): void {
        DB::table('master.users')->where('id', $this->f['super'])->delete();
        $this->withSeedEnv('pemilik@uji.test', function () {
            $this->seed(AdminUserSeeder::class);
            $this->seed(AdminUserSeeder::class); // dijalankan ulang: tidak berubah
        });

        $owner = User::where('email', 'pemilik@uji.test')->with('role')->sole();
        $this->assertSame('super_admin', $owner->role->role_name);

        // Sudah ada super admin: akun baru dari seeder menjadi admin biasa, peran akun lama tetap
        $this->withSeedEnv('staf@uji.test', fn() => $this->seed(AdminUserSeeder::class));
        $this->assertSame('admin', User::where('email', 'staf@uji.test')->with('role')->sole()->role->role_name);
        $this->assertSame('super_admin', $owner->fresh()->role->role_name);
    }

    public function test_at24_admin_tidak_bisa_membuat_atau_menaikkan_akun_ke_super_admin(): void {
        $admin = $this->tokenFor($this->f['admin']);

        $this->api('POST', '/admin/users', $admin, [
            'role_id' => $this->roleId('super_admin'), 'name' => 'Calon Super', 'email' => 'calon@uji.test', 'password' => 'Rahasia-Uji-2',
        ])->assertStatus(403);
        $this->assertDatabaseMissing('master.users', ['email' => 'calon@uji.test']);

        $otherAdmin = $this->makeUser('Admin Lain', 'admin2@uji.test', 'admin');
        $this->api('PUT', "/admin/users/$otherAdmin", $admin, [
            'role_id' => $this->roleId('super_admin'), 'name' => 'Admin Lain', 'email' => 'admin2@uji.test',
        ])->assertStatus(403);
        $this->assertDatabaseHas('master.users', ['id' => $otherAdmin, 'role_id' => $this->roleId('admin')]);
    }

    public function test_at24_super_admin_tetap_bisa_membuat_super_admin(): void {
        $this->api('POST', '/admin/users', $this->tokenFor($this->f['super']), [
            'role_id' => $this->roleId('super_admin'), 'name' => 'Super Kedua', 'email' => 'super2@uji.test', 'password' => 'Rahasia-Uji-2',
        ])->assertCreated();
    }

    private function withSeedEnv(string $email, callable $run): void {
        foreach (['SEED_ADMIN_EMAIL' => $email, 'SEED_ADMIN_PASSWORD' => 'Rahasia-Uji-3'] as $k => $v) {
            putenv("$k=$v");
            $_ENV[$k] = $_SERVER[$k] = $v;
        }
        try {
            $run();
        } finally {
            foreach (['SEED_ADMIN_EMAIL', 'SEED_ADMIN_PASSWORD'] as $k) {
                putenv($k);
                unset($_ENV[$k], $_SERVER[$k]);
            }
        }
    }
}
