<?php

namespace App\Console\Commands;

use App\Models\Admin\User;
use App\Models\System\Backup;
use App\Services\System\BackupService;
use Illuminate\Console\Command;

/**
 * Pemulihan dari terminal server, untuk keadaan darurat saat halaman Admin tidak bisa dibuka.
 * Prosedurnya sama dengan menu web: verifikasi, kunci API, backup pengaman, transaksi tunggal.
 */
class BackupRestore extends Command
{
    protected $signature = 'backup:restore {backup? : ID atau nama berkas backup} {--no-files : Pulihkan database saja} {--list : Tampilkan daftar backup}';

    protected $description = 'Pulihkan database (dan berkas) dari backup';

    public function handle(BackupService $service): int {
        if ($this->option('list') || !$this->argument('backup')) {
            $this->table(['ID', 'Berkas', 'Jenis', 'Ukuran', 'Berkas upload'], Backup::where('status', 'SUCCESS')->latest()->get()
                ->map(fn($b) => [$b->id, $b->filename, $b->type, $service->humanSize($b->size_bytes), $b->include_files ? 'ya' : 'tidak']));
            return self::SUCCESS;
        }

        $key = $this->argument('backup');
        $backup = Backup::where('filename', basename($key))->orWhere(fn($q) => $q->whereRaw('id::text = ?', [$key]))->first();

        // Berkas .zip yang disalin manual (mis. dari server lama) didaftarkan dulu setelah diverifikasi
        if (!$backup && is_file($key)) {
            try {
                $backup = $service->importUpload($key, null, 'Didaftarkan dari terminal: ' . basename($key));
                $this->info("Berkas didaftarkan sebagai {$backup->filename}.");
            } catch (\RuntimeException $e) {
                $this->error($e->getMessage());
                return self::FAILURE;
            }
        }
        if (!$backup) {
            $this->error('Backup tidak ditemukan. Gunakan --list, atau berikan path berkas .zip.');
            return self::FAILURE;
        }

        // Dicatat atas nama super admin pertama; akun admin hanya cadangan untuk instalasi lama tanpa super admin
        $admin = User::whereHas('role', fn($q) => $q->where('role_name', 'super_admin'))->orderBy('created_at')->first()
            ?? User::whereHas('role', fn($q) => $q->where('role_name', 'admin'))->orderBy('created_at')->first();
        $restoreFiles = !$this->option('no-files');

        try {
            $check = $service->beginRestore($backup, $admin?->id, $restoreFiles);
        } catch (\RuntimeException $e) {
            $this->error($e->getMessage());
            return self::FAILURE;
        }

        foreach ($check['checks'] as $c) $this->line(($c['ok'] ? '  ✓ ' : '  ✗ ') . $c['label'] . ': ' . $c['detail']);
        $this->warn('Seluruh data saat ini akan diganti dengan isi ' . $backup->filename . '. Backup pengaman dibuat otomatis lebih dulu.');

        if ($this->ask('Ketik PULIHKAN untuk melanjutkan') !== 'PULIHKAN') {
            @unlink($service->restoreLockPath());
            $backup->update(['restore_status' => null]);
            $this->info('Dibatalkan.');
            return self::SUCCESS;
        }

        $backup = $service->performRestore($backup, $admin?->id, $restoreFiles);
        if ($backup->restore_status !== 'SUCCESS') {
            $this->error('Pemulihan gagal: ' . $backup->restore_error);
            return self::FAILURE;
        }
        $this->info('Pemulihan selesai.');
        return self::SUCCESS;
    }
}
