<?php

namespace App\Models\Finance;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use LogicException;

/**
 * Jejak audit keuangan. Hanya boleh ditambah; mengubah atau menghapus baris ditolak.
 */
class FinanceAuditLog extends Model
{
    use HasUuids;

    protected $table = 'logs.finance_audit_logs';
    public $timestamps = false;

    protected $fillable = ['entity_type', 'entity_id', 'action', 'actor_id', 'actor_name', 'before', 'after', 'reason', 'meta', 'ip_address', 'created_at'];

    protected function casts(): array {
        return ['before' => 'array', 'after' => 'array', 'meta' => 'array', 'created_at' => 'datetime'];
    }

    protected static function booted(): void {
        static::updating(fn() => throw new LogicException('Jejak audit keuangan tidak boleh diubah.'));
        static::deleting(fn() => throw new LogicException('Jejak audit keuangan tidak boleh dihapus.'));
    }
}
