<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Tanda cron schedule:run berjalan (ditampilkan di menu Backup)
Schedule::call(fn() => Cache::put('backup:scheduler_heartbeat', now()->toIso8601String(), 86400))
    ->everyMinute()
    ->name('scheduler-heartbeat');

// Backup otomatis sesuai jadwal yang diatur Admin
Schedule::command('backup:scheduled')->everyMinute()->withoutOverlapping(180)->runInBackground();
