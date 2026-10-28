<?php

namespace App\Models\System;

use Illuminate\Database\Eloquent\Model;

/**
 * Jadwal backup otomatis (satu baris). Waktu dalam WIB.
 * day_of_week: 1 = Senin ... 7 = Minggu (WEEKLY); day_of_month: 1-28 (MONTHLY).
 */
class BackupSetting extends Model
{
    protected $table = 'public.backup_settings';

    public const FREQUENCIES = ['DAILY', 'WEEKLY', 'MONTHLY'];

    protected $fillable = [
        'enabled', 'frequency', 'run_time', 'day_of_week', 'day_of_month', 'include_files', 'retention_count', 'updated_by',
    ];

    protected $casts = [
        'enabled'         => 'boolean',
        'include_files'   => 'boolean',
        'day_of_week'     => 'integer',
        'day_of_month'    => 'integer',
        'retention_count' => 'integer',
    ];

    public static function current(): self {
        return static::query()->orderBy('id')->first() ?? static::create([])->refresh();
    }
}
