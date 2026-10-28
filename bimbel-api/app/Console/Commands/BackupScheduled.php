<?php

namespace App\Console\Commands;

use App\Services\System\BackupService;
use Illuminate\Console\Command;

class BackupScheduled extends Command
{
    protected $signature = 'backup:scheduled';

    protected $description = 'Jalankan backup otomatis bila jadwal dari Admin sudah tiba (dipanggil schedule:run tiap menit)';

    public function handle(BackupService $service): int {
        $backup = $service->runScheduledIfDue();
        if ($backup) $this->line("Backup terjadwal: {$backup->status} {$backup->filename}");
        return self::SUCCESS;
    }
}
