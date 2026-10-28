<?php

namespace App\Console\Commands;

use App\Services\System\BackupService;
use Illuminate\Console\Command;

class BackupRun extends Command
{
    protected $signature = 'backup:run {--no-files : Hanya database, tanpa berkas upload} {--note= : Catatan backup}';

    protected $description = 'Buat backup manual (database + berkas upload)';

    public function handle(BackupService $service): int {
        $backup = $service->run($service->start('MANUAL', !$this->option('no-files'), null, $this->option('note')));

        if ($backup->status !== 'SUCCESS') {
            $this->error('Backup gagal: ' . $backup->error_message);
            return self::FAILURE;
        }
        $this->info("Backup selesai: {$backup->path()} (" . $service->humanSize($backup->size_bytes) . ')');
        return self::SUCCESS;
    }
}
