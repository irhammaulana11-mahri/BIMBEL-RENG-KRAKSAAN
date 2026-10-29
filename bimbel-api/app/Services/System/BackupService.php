<?php
namespace App\Services\System;

use App\Models\Admin\User;
use App\Models\System\Backup;
use App\Models\System\BackupSetting;
use App\Notifications\PortalNotification;
use App\Support\LocalTime;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Str;
use RuntimeException;
use Throwable;
use ZipArchive;

/**
 * Backup & pemulihan database + berkas upload.
 *
 * Isi arsip ZIP:
 *   database.dump  : pg_dump format custom (tanpa tabel di config backup.excluded_tables)
 *   files/private/ : berkas privat (materi, bukti bayar, ...), bila include_files
 *   files/public/  : gambar website, bila include_files
 *   manifest.json  : checksum dump, daftar migration, ringkasan isi
 *
 * Prosedur pemulihan aman:
 *   1. arsip diverifikasi (checksum, dump dapat dibaca, migration tidak lebih baru dari aplikasi)
 *   2. API dikunci (BlockDuringRestore) agar tidak ada data baru yang hilang
 *   3. backup pengaman otomatis (PRE_RESTORE) dibuat; bila gagal, pemulihan dibatalkan
 *   4. database diganti dalam SATU transaksi: gagal di tengah = tidak ada yang berubah
 *   5. berkas ditukar setelah database berhasil; folder lama dikembalikan bila penukaran gagal
 *   6. migration dijalankan agar backup lama sesuai versi aplikasi
 */
class BackupService {

    public const FORMAT = 1;

    // ---------------------------------------------------------------------
    // Backup
    // ---------------------------------------------------------------------

    /** Catat backup baru (status RUNNING). Jalankan isinya dengan run(). */
    public function start(string $type, bool $includeFiles, ?string $userId = null, ?string $note = null): Backup {
        return Cache::lock('backup:start', 10)->block(5, function () use ($type, $includeFiles, $userId, $note) {
            $this->assertIdle();
            return $this->createRecord($type, $includeFiles, $userId, $note);
        });
    }

    public function run(Backup $backup): Backup {
        @set_time_limit(0);
        ignore_user_abort(true);

        $dir = $this->directory();
        $work = $dir . '/tmp-' . $backup->id;
        $filename = 'backup-' . Carbon::now(LocalTime::TIMEZONE)->format('Ymd-His') . '-' . strtolower($backup->type) . '-' . substr($backup->id, -6) . '.zip';
        $partial = $dir . '/' . $filename . '.partial';

        try {
            File::ensureDirectoryExists($work, 0750);
            $dump = $work . '/database.dump';
            $this->dumpDatabase($dump);

            $files = ['private' => 0, 'public' => 0];
            $zip = new ZipArchive();
            if ($zip->open($partial, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
                throw new RuntimeException('Arsip backup tidak dapat dibuat.');
            }
            $zip->addFile($dump, 'database.dump');
            // Dump sudah terkompresi
            $zip->setCompressionName('database.dump', ZipArchive::CM_STORE);

            if ($backup->include_files) {
                foreach (config('backup.directories') as $name => $path) {
                    $files[$name] = $this->addDirectory($zip, $path, "files/{$name}");
                }
            }

            $manifest = [
                'format'        => self::FORMAT,
                'app'           => config('app.name'),
                'created_at'    => now()->toIso8601String(),
                'type'          => $backup->type,
                'include_files' => $backup->include_files,
                'files'         => $files,
                'database'      => [
                    'name'           => config('database.connections.pgsql.database'),
                    'server_version' => DB::selectOne('SHOW server_version')->server_version,
                    'dump_size'      => filesize($dump),
                    'dump_sha256'    => hash_file('sha256', $dump),
                ],
                'migrations'      => DB::table('public.migrations')->orderBy('id')->pluck('migration')->all(),
                'excluded_tables' => config('backup.excluded_tables'),
            ];
            $zip->addFromString('manifest.json', json_encode($manifest, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));

            if (!$zip->close()) throw new RuntimeException('Arsip backup gagal ditulis.');

            $final = $dir . '/' . $filename;
            rename($partial, $final);
            @chmod($final, 0640);

            $backup->update([
                'filename'    => $filename,
                'status'      => 'SUCCESS',
                'size_bytes'  => filesize($final),
                'checksum'    => hash_file('sha256', $final),
                'manifest'    => collect($manifest)->except('migrations')->all() + [
                    'migration_count'  => count($manifest['migrations']),
                    'migration_latest' => end($manifest['migrations']) ?: null,
                ],
                'finished_at' => now(),
            ]);
        } catch (Throwable $e) {
            @unlink($partial);
            $backup->update(['status' => 'FAILED', 'error_message' => $e->getMessage(), 'finished_at' => now()]);
            Log::error('Backup gagal', ['backup_id' => $backup->id, 'error' => $e->getMessage()]);
            if ($backup->type === 'SCHEDULED') {
                $this->notifyAdmins('backup_failed', 'Backup otomatis gagal', 'Backup terjadwal gagal dibuat: ' . $e->getMessage());
            }
        } finally {
            File::deleteDirectory($work);
        }

        $this->prune();
        return $backup->refresh();
    }

    /** Simpan arsip unggahan (mis. dari server lama) setelah isinya diverifikasi. */
    public function importUpload(string $uploadedPath, ?string $userId, ?string $note = null): Backup {
        $filename = 'backup-' . Carbon::now(LocalTime::TIMEZONE)->format('Ymd-His') . '-uploaded-' . Str::lower(Str::random(6)) . '.zip';
        $target = $this->directory() . '/' . $filename;
        if (!copy($uploadedPath, $target)) throw new RuntimeException('Berkas unggahan tidak dapat disimpan.');
        @chmod($target, 0640);

        $backup = $this->createRecord('UPLOADED', false, $userId, $note);
        $backup->update(['filename' => $filename]);

        try {
            $check = $this->verify($backup);
            $manifest = $check['manifest'];
            $backup->update([
                'status'        => 'SUCCESS',
                'include_files' => (bool) ($manifest['include_files'] ?? false),
                'size_bytes'    => filesize($target),
                'checksum'      => hash_file('sha256', $target),
                'manifest'      => collect($manifest)->except('migrations')->all() + [
                    'migration_count'  => count($manifest['migrations'] ?? []),
                    'migration_latest' => collect($manifest['migrations'] ?? [])->last(),
                ],
                'finished_at'   => now(),
            ]);
        } catch (Throwable $e) {
            @unlink($target);
            $backup->delete();
            throw $e;
        }

        return $backup->refresh();
    }

    // ---------------------------------------------------------------------
    // Verifikasi
    // ---------------------------------------------------------------------

    /**
     * Periksa arsip tanpa mengubah apa pun.
     * @return array{manifest: array, checks: list<array{label: string, ok: bool, detail: ?string}>, pending_migrations: int}
     * @throws RuntimeException bila arsip tidak layak dipulihkan
     */
    public function verify(Backup $backup): array {
        if (!$backup->fileExists()) throw new RuntimeException('Berkas backup tidak ditemukan di server.');

        $checks = [];
        if ($backup->checksum) {
            $ok = hash_file('sha256', $backup->path()) === $backup->checksum;
            $checks[] = ['label' => 'Checksum arsip', 'ok' => $ok, 'detail' => $ok ? 'Arsip utuh, tidak berubah sejak dibuat' : 'Arsip berubah atau rusak'];
            if (!$ok) throw new RuntimeException('Checksum arsip tidak cocok. Berkas rusak atau telah diubah.');
        }

        $zip = $this->openZip($backup->path());
        $manifest = json_decode((string) $zip->getFromName('manifest.json'), true);
        if (!is_array($manifest) || ($manifest['format'] ?? null) !== self::FORMAT || $zip->locateName('database.dump') === false) {
            $zip->close();
            throw new RuntimeException('Berkas bukan backup aplikasi ini (manifest atau dump database tidak ada).');
        }
        $checks[] = ['label' => 'Isi arsip', 'ok' => true, 'detail' => 'manifest.json & database.dump ditemukan'];

        $work = $this->directory() . '/verify-' . $backup->id . '-' . uniqid();
        try {
            File::ensureDirectoryExists($work, 0750);
            $zip->extractTo($work, 'database.dump');
            $zip->close();
            $dump = $work . '/database.dump';

            if (hash_file('sha256', $dump) !== ($manifest['database']['dump_sha256'] ?? null)) {
                throw new RuntimeException('Checksum dump database tidak cocok dengan manifest.');
            }
            $checks[] = ['label' => 'Checksum database', 'ok' => true, 'detail' => $this->humanSize(filesize($dump))];

            $this->tableOfContents($dump);
            $checks[] = ['label' => 'Dump dapat dibaca', 'ok' => true, 'detail' => 'pg_restore berhasil membaca daftar isi'];
        } finally {
            File::deleteDirectory($work);
        }

        // Backup dari versi aplikasi yang lebih baru tidak boleh dipulihkan ke kode lama
        // (migration yang tidak ada di kode maupun di database sekarang; sisa migration lama yang berkasnya sudah dihapus diabaikan)
        $migrator = app('migrator');
        $codeMigrations = collect($migrator->getMigrationFiles(array_merge([database_path('migrations')], $migrator->paths())))->keys();
        $backupMigrations = collect($manifest['migrations'] ?? []);
        $unknown = $backupMigrations->diff($codeMigrations)->diff(DB::table('public.migrations')->pluck('migration'));
        if ($unknown->isNotEmpty()) {
            throw new RuntimeException('Backup berasal dari versi aplikasi yang lebih baru (' . $unknown->count() . ' migration tidak dikenal). Perbarui aplikasi terlebih dahulu.');
        }
        $pending = $codeMigrations->diff($backupMigrations)->count();
        $checks[] = [
            'label'  => 'Versi database',
            'ok'     => true,
            'detail' => $pending ? "Backup versi lama; {$pending} migration akan dijalankan setelah pemulihan" : 'Sama dengan versi aplikasi',
        ];

        return ['manifest' => $manifest, 'checks' => $checks, 'pending_migrations' => $pending];
    }

    // ---------------------------------------------------------------------
    // Pemulihan
    // ---------------------------------------------------------------------

    /** Verifikasi & kunci sistem. Pemulihannya sendiri dijalankan performRestore() (setelah respons dikirim). */
    public function beginRestore(Backup $backup, ?string $userId, bool $restoreFiles): array {
        return Cache::lock('backup:start', 10)->block(5, function () use ($backup, $userId, $restoreFiles) {
            $this->assertIdle();
            if ($backup->status !== 'SUCCESS') throw new RuntimeException('Hanya backup yang berhasil yang dapat dipulihkan.');

            $check = $this->verify($backup);

            File::put($this->restoreLockPath(), json_encode([
                'backup_id'     => $backup->id,
                'filename'      => $backup->filename,
                'restore_files' => $restoreFiles && $backup->include_files,
                'user_id'       => $userId,
                'started_at'    => now()->toIso8601String(),
            ]));
            $backup->update(['restore_status' => 'RUNNING', 'restore_error' => null, 'restored_by' => $userId]);

            return $check;
        });
    }

    private static bool $restoring = false;

    public function performRestore(Backup $backup, ?string $userId, bool $restoreFiles): Backup {
        // Cegah pemulihan ganda dalam proses yang sama
        if (self::$restoring) return $backup;
        self::$restoring = true;

        @set_time_limit(0);
        ignore_user_abort(true);

        $restoreFiles = $restoreFiles && $backup->include_files;
        $work = $this->directory() . '/restore-' . $backup->id;
        $databaseDone = false;

        try {
            // Backup pengaman dari kondisi sekarang
            $safety = $this->run($this->createRecord('PRE_RESTORE', $restoreFiles, $userId, 'Otomatis sebelum memulihkan ' . $backup->filename));
            if ($safety->status !== 'SUCCESS') {
                throw new RuntimeException('Backup pengaman gagal dibuat (' . $safety->error_message . '). Pemulihan dibatalkan, data tidak berubah.');
            }

            File::ensureDirectoryExists($work, 0750);
            $zip = $this->openZip($backup->path());
            $zip->extractTo($work, 'database.dump');
            $fileEntries = $restoreFiles ? $this->safeFileEntries($zip) : [];
            if ($fileEntries) $zip->extractTo($work, $fileEntries);
            $zip->close();

            $this->restoreDatabase($work . '/database.dump', $work);
            $databaseDone = true;

            if ($restoreFiles) $this->swapDirectories($work . '/files');

            // Migrator langsung, bukan Artisan::call: console kernel akan memanggil ulang callback defer() yang sedang berjalan
            $migrator = app('migrator');
            $migrator->run(array_merge([database_path('migrations')], $migrator->paths()));
            Cache::flush();

            $backup->update(['restore_status' => 'SUCCESS', 'restore_error' => null, 'restored_by' => $userId, 'restored_at' => now()]);

            $this->logActivity($userId, "Memulihkan backup {$backup->filename}" . ($restoreFiles ? ' (database + berkas)' : ' (database)'));
            $this->notifyAdmins('backup_restored', 'Data dipulihkan', "Sistem dipulihkan dari backup {$backup->filename}. Backup pengaman: {$safety->filename}.");
        } catch (Throwable $e) {
            $message = $databaseDone
                ? 'Database sudah dipulihkan, tetapi berkas gagal ditukar (berkas lama tetap dipakai): ' . $e->getMessage()
                : $e->getMessage();
            $backup->update(['restore_status' => 'FAILED', 'restore_error' => $message]);
            Log::error('Pemulihan backup gagal', ['backup_id' => $backup->id, 'error' => $e->getMessage()]);
        } finally {
            File::deleteDirectory($work);
            @unlink($this->restoreLockPath());
            self::$restoring = false;
        }

        return $backup->refresh();
    }

    /** Info pemulihan yang sedang berjalan, null bila tidak ada (kunci kedaluwarsa diabaikan). */
    public function restoreInProgress(): ?array {
        $path = $this->restoreLockPath();
        if (!is_file($path)) return null;
        if (filemtime($path) < time() - config('backup.stale_minutes') * 60) return null;
        return json_decode((string) file_get_contents($path), true) ?: [];
    }

    public function restoreLockPath(): string {
        return storage_path('framework/restore.lock');
    }

    // ---------------------------------------------------------------------
    // Jadwal & retensi
    // ---------------------------------------------------------------------

    /** Slot jadwal terakhir yang sudah lewat (timezone aplikasi), null bila jadwal nonaktif. */
    public function lastSlot(BackupSetting $s, ?Carbon $now = null): ?Carbon {
        if (!$s->enabled) return null;
        $now = ($now ?? now())->copy()->setTimezone(LocalTime::TIMEZONE);
        [$h, $m] = array_map('intval', explode(':', $s->run_time));

        $slot = match ($s->frequency) {
            'WEEKLY'  => $now->copy()->startOfWeek(Carbon::MONDAY)->addDays($s->day_of_week - 1)->setTime($h, $m),
            'MONTHLY' => $now->copy()->startOfMonth()->addDays($s->day_of_month - 1)->setTime($h, $m),
            default   => $now->copy()->setTime($h, $m),
        };
        if ($slot->greaterThan($now)) {
            $slot = match ($s->frequency) {
                'WEEKLY'  => $slot->subWeek(),
                'MONTHLY' => $slot->subMonthNoOverflow(),
                default   => $slot->subDay(),
            };
        }
        return $slot->setTimezone(config('app.timezone'));
    }

    public function nextSlot(BackupSetting $s, ?Carbon $now = null): ?Carbon {
        $last = $this->lastSlot($s, $now);
        if (!$last) return null;
        $local = $last->copy()->setTimezone(LocalTime::TIMEZONE);
        $next = match ($s->frequency) {
            'WEEKLY'  => $local->addWeek(),
            'MONTHLY' => $local->addMonthNoOverflow(),
            default   => $local->addDay(),
        };
        return $next->setTimezone(config('app.timezone'));
    }

    /** Dipanggil penjadwal tiap menit: jalankan backup bila slot jadwal sudah tiba dan belum dikerjakan. */
    public function runScheduledIfDue(?Carbon $now = null): ?Backup {
        $settings = BackupSetting::current();
        $slot = $this->lastSlot($settings, $now);
        // Slot sebelum jadwal diubah tidak dikejar, agar menyimpan pengaturan tidak langsung memicu backup
        if (!$slot || $slot->lessThan($settings->updated_at)) return null;

        $alreadyDone = Backup::where('type', 'SCHEDULED')->where('started_at', '>=', $slot)->exists();
        if ($alreadyDone || $this->restoreInProgress()) return null;

        try {
            $backup = $this->start('SCHEDULED', $settings->include_files);
        } catch (RuntimeException) {
            return null; // proses lain sedang berjalan; dicoba lagi menit berikutnya
        }
        return $this->run($backup);
    }

    /** Hapus backup terjadwal & pengaman yang melebihi batas simpan; tandai proses macet sebagai gagal. */
    public function prune(): void {
        Backup::where('status', 'RUNNING')
            ->where('started_at', '<', now()->subMinutes(config('backup.stale_minutes')))
            ->update(['status' => 'FAILED', 'error_message' => 'Proses terhenti sebelum selesai.', 'finished_at' => now()]);

        $limits = [
            'SCHEDULED'   => max(1, BackupSetting::current()->retention_count),
            'PRE_RESTORE' => config('backup.keep_pre_restore'),
        ];
        foreach ($limits as $type => $keep) {
            Backup::where('type', $type)->where('status', 'SUCCESS')
                // id UUIDv7 berurutan waktu: pembeda bila created_at sama (detik yang sama)
                ->orderByDesc('created_at')->orderByDesc('id')->skip($keep)->take(1000)->get()
                ->each(fn(Backup $b) => $this->delete($b));
        }

        Backup::where('status', 'FAILED')->where('created_at', '<', now()->subDays(30))->delete();
    }

    public function delete(Backup $backup): void {
        if ($backup->status === 'RUNNING' || $backup->restore_status === 'RUNNING') {
            throw new RuntimeException('Backup sedang diproses dan tidak dapat dihapus.');
        }
        if ($backup->fileExists()) @unlink($backup->path());
        $backup->delete();
    }

    // ---------------------------------------------------------------------
    // Ringkasan untuk halaman Admin
    // ---------------------------------------------------------------------

    public function overview(): array {
        $settings = BackupSetting::current();
        $heartbeat = Cache::get('backup:scheduler_heartbeat');
        $lastSuccess = Backup::where('status', 'SUCCESS')->whereIn('type', ['MANUAL', 'SCHEDULED'])->latest('finished_at')->first();
        $free = @disk_free_space($this->directory());

        return [
            'settings' => $settings,
            'summary'  => [
                'total'           => Backup::where('status', 'SUCCESS')->count(),
                'total_size'      => (int) Backup::where('status', 'SUCCESS')->sum('size_bytes'),
                'last_success_at' => LocalTime::format($lastSuccess?->finished_at, 'Y-m-d H:i'),
                'last_success_age_hours' => $lastSuccess ? (int) $lastSuccess->finished_at->diffInHours(now()) : null,
                'next_run_at'     => LocalTime::format($this->nextSlot($settings), 'Y-m-d H:i'),
                'scheduler_seen_at' => $heartbeat ? LocalTime::format(Carbon::parse($heartbeat), 'Y-m-d H:i') : null,
                // Penjadwal dianggap aktif bila cron schedule:run terlihat dalam 5 menit terakhir
                'scheduler_active'  => $heartbeat && Carbon::parse($heartbeat)->greaterThan(now()->subMinutes(5)),
                'disk_free'       => $free !== false ? (int) $free : null,
                'database_size'   => (int) DB::selectOne('SELECT pg_database_size(current_database()) AS s')->s,
                'running'         => Backup::where('status', 'RUNNING')->exists(),
                'restore'         => $this->restoreInProgress(),
            ],
        ];
    }

    public function humanSize(?int $bytes): string {
        if (!$bytes) return '0 B';
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        $i = min((int) floor(log($bytes, 1024)), count($units) - 1);
        return round($bytes / (1024 ** $i), 1) . ' ' . $units[$i];
    }

    // ---------------------------------------------------------------------
    // Internal
    // ---------------------------------------------------------------------

    private function createRecord(string $type, bool $includeFiles, ?string $userId, ?string $note): Backup {
        $free = @disk_free_space($this->directory());
        if ($free !== false && $free < config('backup.min_free_mb') * 1024 * 1024) {
            throw new RuntimeException('Ruang disk server tidak cukup untuk membuat backup (sisa ' . $this->humanSize((int) $free) . ').');
        }
        return Backup::create([
            'type'          => $type,
            'status'        => 'RUNNING',
            'include_files' => $includeFiles,
            'created_by'    => $userId,
            'note'          => $note,
            'started_at'    => now(),
        ]);
    }

    private function assertIdle(): void {
        if ($this->restoreInProgress()) throw new RuntimeException('Pemulihan data sedang berjalan.');
        $running = Backup::where('status', 'RUNNING')
            ->where('started_at', '>=', now()->subMinutes(config('backup.stale_minutes')))
            ->exists();
        if ($running) throw new RuntimeException('Masih ada proses backup yang berjalan. Tunggu hingga selesai.');
    }

    private function directory(): string {
        $dir = rtrim(config('backup.path'), '/');
        File::ensureDirectoryExists($dir, 0750);
        return $dir;
    }

    /** @return array{0: array, 1: array} [argumen koneksi, env] */
    private function connectionArgs(): array {
        $c = config('database.connections.pgsql');
        return [
            ['-h', (string) $c['host'], '-p', (string) $c['port'], '-U', (string) $c['username']],
            ['PGPASSWORD' => (string) $c['password'], 'PGCONNECT_TIMEOUT' => '10', 'PGOPTIONS' => '-c client_min_messages=warning'],
        ];
    }

    private function dumpDatabase(string $target): void {
        [$conn, $env] = $this->connectionArgs();
        $command = [config('backup.pg_dump'), ...$conn, '-d', config('database.connections.pgsql.database'),
            '-Fc', '-Z', '6', '--no-owner', '--no-privileges', '-f', $target];
        // Sequence milik tabel yang dikecualikan ikut dikecualikan (tabelnya tidak dihapus saat pemulihan)
        foreach (config('backup.excluded_tables') as $table) {
            $command[] = '--exclude-table=' . $table;
            $command[] = '--exclude-table=' . $table . '_id_seq';
        }

        $result = Process::env($env)->timeout(3600)->run($command);
        if (!$result->successful()) throw new RuntimeException('pg_dump gagal: ' . trim($result->errorOutput()));
    }

    private function tableOfContents(string $dump): string {
        $result = Process::timeout(300)->run([config('backup.pg_restore'), '-l', $dump]);
        if (!$result->successful()) throw new RuntimeException('Dump database tidak dapat dibaca: ' . trim($result->errorOutput()));
        return $result->output();
    }

    /**
     * Ganti seluruh isi database dalam satu transaksi psql:
     * hapus schema & tabel aplikasi (kecuali tabel yang dikecualikan), lalu buat ulang dari dump.
     */
    private function restoreDatabase(string $dump, string $work): void {
        $toc = $this->tableOfContents($dump);

        // Extension & schema public sudah ada di server; COMMENT ON EXTENSION butuh superuser
        $schemas = [];
        $lines = [];
        foreach (preg_split('/\R/', $toc) as $line) {
            if (preg_match('/^\d+; \d+ \d+ SCHEMA - (\S+)/', $line, $m)) {
                if ($m[1] === 'public') continue;
                $schemas[] = $m[1];
            }
            if (preg_match('/ (EXTENSION|COMMENT - EXTENSION|COMMENT - SCHEMA public)\b/', $line)) continue;
            $lines[] = $line;
        }
        File::put($work . '/toc.list', implode("\n", $lines) . "\n");

        $sql = $work . '/restore.sql';
        $result = Process::timeout(3600)->run([config('backup.pg_restore'), '-L', $work . '/toc.list', '--no-owner', '--no-privileges', '-f', $sql, $dump]);
        if (!$result->successful()) throw new RuntimeException('Dump database tidak dapat diproses: ' . trim($result->errorOutput()));

        $excluded = collect(config('backup.excluded_tables'))->map(fn($t) => strtolower($t));
        $publicTables = collect(DB::select("SELECT tablename FROM pg_tables WHERE schemaname = 'public'"))
            ->map(fn($r) => 'public.' . $r->tablename)
            ->reject(fn($t) => $excluded->contains(strtolower($t)));

        $prepare = ["SET lock_timeout = '60s';"];
        foreach ($schemas as $schema) $prepare[] = 'DROP SCHEMA IF EXISTS "' . str_replace('"', '""', $schema) . '" CASCADE;';
        foreach ($publicTables as $table) $prepare[] = 'DROP TABLE IF EXISTS public."' . str_replace('"', '""', substr($table, 7)) . '" CASCADE;';
        File::put($work . '/prepare.sql', implode("\n", $prepare) . "\n");

        // Lepas koneksi aplikasi agar tidak menahan lock tabel yang akan dihapus
        DB::disconnect();

        [$conn, $env] = $this->connectionArgs();
        $result = Process::env($env)->timeout(3600)->run([
            config('backup.psql'), ...$conn, '-d', config('database.connections.pgsql.database'),
            '-X', '-q', '--single-transaction', '-v', 'ON_ERROR_STOP=1',
            '-f', $work . '/prepare.sql', '-f', $sql,
        ]);
        if (!$result->successful()) {
            throw new RuntimeException('Pemulihan database gagal dan dibatalkan (data tidak berubah): ' . trim($result->errorOutput()));
        }
    }

    /** Nama entri files/private|public/... yang aman diekstrak (tanpa path traversal). */
    private function safeFileEntries(ZipArchive $zip): array {
        $entries = [];
        for ($i = 0; $i < $zip->numFiles; $i++) {
            $name = $zip->getNameIndex($i);
            if (!preg_match('#^files/(private|public)/#', $name)) continue;
            if (str_contains($name, '..') || str_contains($name, '\\') || str_contains($name, "\0")) {
                throw new RuntimeException('Arsip berisi path berkas yang tidak aman.');
            }
            $entries[] = $name;
        }
        return $entries;
    }

    /** Tukar folder berkas dengan hasil ekstrak; folder lama disimpan sementara dan dikembalikan bila gagal. */
    private function swapDirectories(string $extracted): void {
        $swapped = [];
        $suffix = '.before-restore-' . date('YmdHis');
        try {
            foreach (config('backup.directories') as $name => $path) {
                $incoming = $extracted . '/' . $name;
                if (!is_dir($incoming)) File::ensureDirectoryExists($incoming, 0755);
                if (is_dir($path) && !rename($path, $path . $suffix)) throw new RuntimeException("Folder {$name} tidak dapat dipindahkan.");
                $swapped[$name] = $path;
                if (!rename($incoming, $path)) throw new RuntimeException("Folder {$name} hasil backup tidak dapat dipasang.");
            }
        } catch (Throwable $e) {
            foreach ($swapped as $path) {
                if (is_dir($path . $suffix)) {
                    File::deleteDirectory($path);
                    rename($path . $suffix, $path);
                }
            }
            throw $e;
        }
        foreach ($swapped as $path) File::deleteDirectory($path . $suffix);
    }

    private function addDirectory(ZipArchive $zip, string $path, string $prefix): int {
        if (!is_dir($path)) return 0;
        $count = 0;
        $zip->addEmptyDir($prefix);
        foreach (File::allFiles($path, true) as $file) {
            if ($file->isLink()) continue;
            $zip->addFile($file->getPathname(), $prefix . '/' . str_replace('\\', '/', $file->getRelativePathname()));
            $count++;
        }
        return $count;
    }

    private function openZip(string $path): ZipArchive {
        $zip = new ZipArchive();
        if ($zip->open($path, ZipArchive::RDONLY) !== true) throw new RuntimeException('Berkas backup bukan arsip ZIP yang valid.');
        return $zip;
    }

    private function logActivity(?string $userId, string $activity): void {
        try {
            DB::table('logs.activity_logs')->insert([
                'user_id'    => $userId && User::whereKey($userId)->exists() ? $userId : null,
                'activity'   => $activity . (app()->runningInConsole() ? ' (via terminal)' : ''),
                'ip_address' => request()?->ip(),
            ]);
        } catch (Throwable) {
            // log aktivitas tidak boleh menggagalkan pemulihan
        }
    }

    private function notifyAdmins(string $kind, string $title, string $message): void {
        try {
            // Hanya super admin yang bisa membuka menu Backup
            $admins = User::whereHas('role', fn($q) => $q->where('role_name', 'super_admin'))->get();
            Notification::send($admins, new PortalNotification($kind, $title, $message, [], '/admin/backups'));
        } catch (Throwable $e) {
            Log::warning('Notifikasi backup gagal', ['error' => $e->getMessage()]);
        }
    }
}
