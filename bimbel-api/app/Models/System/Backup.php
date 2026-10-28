<?php

namespace App\Models\System;

use App\Models\Admin\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * Satu berkas backup: arsip ZIP berisi dump database (pg_dump -Fc), berkas upload (opsional),
 * dan manifest.json (checksum, versi migration).
 */
class Backup extends Model
{
    use HasUuids;

    protected $table = 'public.backups';

    public const TYPES = ['MANUAL', 'SCHEDULED', 'PRE_RESTORE', 'UPLOADED'];

    public const TYPE_LABELS = [
        'MANUAL'      => 'Manual',
        'SCHEDULED'   => 'Terjadwal',
        'PRE_RESTORE' => 'Sebelum pemulihan',
        'UPLOADED'    => 'Unggahan',
    ];

    protected $fillable = [
        'filename', 'type', 'status', 'include_files', 'size_bytes', 'checksum', 'manifest', 'note',
        'error_message', 'created_by', 'started_at', 'finished_at',
        'restore_status', 'restore_error', 'restored_by', 'restored_at',
    ];

    protected $casts = [
        'include_files' => 'boolean',
        'manifest'      => 'array',
        'size_bytes'    => 'integer',
        'started_at'    => 'datetime',
        'finished_at'   => 'datetime',
        'restored_at'   => 'datetime',
    ];

    public function creator() {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function restorer() {
        return $this->belongsTo(User::class, 'restored_by');
    }

    public function path(): ?string {
        return $this->filename ? rtrim(config('backup.path'), '/') . '/' . $this->filename : null;
    }

    public function fileExists(): bool {
        return $this->path() !== null && is_file($this->path());
    }
}
