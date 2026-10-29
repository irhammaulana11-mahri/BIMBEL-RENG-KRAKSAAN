<?php

namespace Tests;

use Illuminate\Foundation\Testing\DatabaseTransactions;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * Semua test berjalan di database PostgreSQL terisolasi `bimbel_test`.
 *
 * Sekali per proses test, seluruh schema aplikasi dikosongkan lalu migration + seeder acuan dijalankan.
 * Setiap test kemudian dibungkus transaksi (DatabaseTransactions) sehingga tidak saling memengaruhi.
 * Pengosongan hanya mau berjalan bila koneksi benar-benar menunjuk ke `bimbel_test`.
 */
abstract class TestCase extends BaseTestCase
{
    use DatabaseTransactions;

    public const TEST_DATABASE = 'bimbel_test';

    private const APP_SCHEMAS = ['master', 'academic', 'exam', 'finance', 'website', 'logs'];

    private static bool $databasePrepared = false;

    protected function setUpTraits()
    {
        $this->guardTestDatabase();

        if (!self::$databasePrepared) {
            $this->prepareTestDatabase();
            self::$databasePrepared = true;
        }

        config(['backup.path' => storage_path('framework/testing/backups')]);

        return parent::setUpTraits();
    }

    /**
     * Hentikan test bila ada tanda koneksi bisa mengenai database selain database uji,
     * mis. config di-cache (variabel phpunit.xml diabaikan) atau DB_DATABASE tertimpa.
     */
    private function guardTestDatabase(): void {
        if ($this->app->configurationIsCached()) {
            throw new RuntimeException('Config Laravel ter-cache; jalankan `php artisan config:clear` sebelum test.');
        }
        if (!$this->app->environment('testing')) {
            throw new RuntimeException('Test hanya boleh berjalan dengan APP_ENV=testing.');
        }
        $configured = config('database.connections.' . config('database.default') . '.database');
        if (config('database.default') !== 'pgsql' || $configured !== self::TEST_DATABASE) {
            throw new RuntimeException("Test hanya boleh memakai database " . self::TEST_DATABASE . ", bukan {$configured}.");
        }
        if (DB::selectOne('select current_database() as name')->name !== self::TEST_DATABASE) {
            throw new RuntimeException('Koneksi aktif tidak menunjuk ke ' . self::TEST_DATABASE . '.');
        }
    }

    /**
     * migrate:fresh bawaan hanya mengosongkan schema di search_path (public), jadi schema aplikasi
     * dihapus manual. Extension di public (uuid-ossp) dibiarkan.
     */
    private function prepareTestDatabase(): void {
        foreach (self::APP_SCHEMAS as $schema) {
            DB::statement("DROP SCHEMA IF EXISTS \"{$schema}\" CASCADE");
        }
        $publicTables = DB::select("select tablename from pg_tables where schemaname = 'public'");
        foreach ($publicTables as $t) {
            DB::statement("DROP TABLE IF EXISTS public.\"{$t->tablename}\" CASCADE");
        }
        $publicSequences = DB::select("select sequence_name from information_schema.sequences where sequence_schema = 'public'");
        foreach ($publicSequences as $s) {
            DB::statement("DROP SEQUENCE IF EXISTS public.\"{$s->sequence_name}\" CASCADE");
        }

        Artisan::call('migrate', ['--force' => true]);
        Artisan::call('db:seed', ['--class' => \Database\Seeders\RoleSeeder::class, '--force' => true]);
    }
}
