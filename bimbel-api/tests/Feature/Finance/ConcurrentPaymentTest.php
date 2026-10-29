<?php

namespace Tests\Feature\Finance;

use App\Models\Finance\Payment;
use Database\Seeders\RoleSeeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Tests\Concerns\BuildsAuditFixtures;
use Tests\TestCase;

/**
 * AT-32: dua pengajuan bukti bayar untuk tagihan yang sama, dari dua proses/koneksi berbeda yang
 * berjalan serentak, menghasilkan tepat satu pembayaran PENDING (D-09).
 *
 * Data uji harus di-commit agar terlihat oleh proses lain, jadi test ini tidak memakai transaksi
 * dan mengosongkan isi database uji sesudahnya.
 */
class ConcurrentPaymentTest extends TestCase
{
    use BuildsAuditFixtures;

    /** Tanpa transaksi per test (DatabaseTransactions) */
    protected $connectionsToTransact = [];

    private const ROUNDS = 5;

    protected function setUp(): void {
        parent::setUp();
        $this->buildAuditFixtures();
    }

    protected function tearDown(): void {
        $this->truncateTestDatabase();
        File::deleteDirectory(storage_path('framework/testing/disks/concurrent'));
        parent::tearDown();
    }

    public function test_at32_dua_pengajuan_serentak_menghasilkan_satu_pending(): void {
        for ($round = 1; $round <= self::ROUNDS; $round++) {
            $results = $this->runWorkersSimultaneously(2);

            $pending = Payment::where('status', 'PENDING')->whereHas('details', fn($q) => $q->where('invoice_id', $this->f['invA']))->count();
            $this->assertSame(1, $pending, "Putaran $round: harus tepat satu PENDING, hasil pekerja: " . implode(', ', $results));
            sort($results);
            $this->assertSame(['DITOLAK', 'OK'], $results, "Putaran $round");

            DB::table('finance.payment_details')->delete();
            DB::table('finance.payments')->delete();
        }
    }

    /** @return string[] keluaran tiap pekerja */
    private function runWorkersSimultaneously(int $count): array {
        $startAt = sprintf('%.6F', microtime(true) + 1.5);
        $worker = base_path('tests/Support/submit_payment_worker.php');
        $env = ['APP_ENV' => 'testing', 'DB_CONNECTION' => 'pgsql', 'DB_DATABASE' => self::TEST_DATABASE, 'DB_URL' => '', 'ANTHROPIC_API_KEY' => ''] + getenv();

        $procs = [];
        for ($i = 0; $i < $count; $i++) {
            $cmd = [PHP_BINARY, $worker, $this->f['puA'], $this->f['invA'], $startAt];
            $procs[] = proc_open($cmd, [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes, base_path(), $env);
            $outputs[$i] = $pipes;
        }

        $results = [];
        foreach ($procs as $i => $proc) {
            $out = trim(stream_get_contents($outputs[$i][1]));
            $err = trim(stream_get_contents($outputs[$i][2]));
            proc_close($proc);
            $results[] = $out !== '' ? $out : "KOSONG ($err)";
        }
        return $results;
    }

    /** Hanya pada database uji (dijaga TestCase); referensi peran diisi ulang untuk test lain. */
    private function truncateTestDatabase(): void {
        $tables = DB::select("select schemaname, tablename from pg_tables where schemaname in ('master','academic','exam','finance','website','logs') or (schemaname = 'public' and tablename <> 'migrations')");
        $list = collect($tables)->map(fn($t) => "\"{$t->schemaname}\".\"{$t->tablename}\"")->implode(', ');
        DB::statement("TRUNCATE $list RESTART IDENTITY CASCADE");
        $this->seed(RoleSeeder::class);
    }
}
