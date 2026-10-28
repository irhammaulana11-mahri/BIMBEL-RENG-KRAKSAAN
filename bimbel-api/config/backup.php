<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Lokasi Berkas Backup
    |--------------------------------------------------------------------------
    | Di luar storage/app/private & public sehingga tidak ikut ter-backup dan tidak
    | dapat diakses dari web. Pindahkan ke disk lain lewat BACKUP_PATH bila perlu.
    */

    'path' => env('BACKUP_PATH', storage_path('app/backups')),

    // Program PostgreSQL client (versinya harus >= versi server)
    'pg_dump'    => env('BACKUP_PG_DUMP', 'pg_dump'),
    'pg_restore' => env('BACKUP_PG_RESTORE', 'pg_restore'),
    'psql'       => env('BACKUP_PSQL', 'psql'),

    /*
    |--------------------------------------------------------------------------
    | Tabel yang Tidak Ikut Di-backup
    |--------------------------------------------------------------------------
    | Riwayat & jadwal backup, cache, antrean, sesi, dan token login. Tabel ini tetap
    | seperti apa adanya saat pemulihan, jadwal backup tidak mundur dan Admin
    | yang memulihkan tidak ikut ter-logout.
    */

    'excluded_tables' => [
        'public.backups',
        'public.backup_settings',
        'public.cache',
        'public.cache_locks',
        'public.jobs',
        'public.job_batches',
        'public.failed_jobs',
        'public.sessions',
        'public.personal_access_tokens',
    ],

    // Folder berkas yang ikut di-backup bila "sertakan berkas" aktif (nama di arsip => path)
    'directories' => [
        'private' => storage_path('app/private'),
        'public'  => storage_path('app/public'),
    ],

    // Backup otomatis yang disimpan sebelum pemulihan (yang lebih lama dihapus)
    'keep_pre_restore' => 5,

    // Sisa ruang disk minimal sebelum backup dijalankan (MB)
    'min_free_mb' => 200,

    // Proses yang tidak selesai lebih dari ini dianggap gagal (menit)
    'stale_minutes' => 120,
];
