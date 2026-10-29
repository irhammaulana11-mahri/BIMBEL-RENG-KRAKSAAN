<?php

namespace App\Services\Finance;

use App\Models\Finance\FinanceAuditLog;
use App\Models\Finance\Invoice;
use App\Models\Finance\Payment;
use App\Models\Finance\PaymentReversal;
use App\Models\Finance\Payroll;
use App\Models\Finance\PayrollTransfer;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use InvalidArgumentException;

/**
 * Pencatat jejak audit keuangan (D-10). Panggil di dalam transaksi perubahan yang dicatat,
 * sehingga perubahan dan jejaknya tersimpan atau batal bersama.
 */
class FinanceAudit
{
    public const ENTITY_TYPES = [
        Invoice::class         => 'invoice',
        Payment::class         => 'payment',
        PaymentReversal::class => 'payment_reversal',
        Payroll::class         => 'payroll',
        PayrollTransfer::class => 'payroll_transfer',
    ];

    /** Kolom yang tidak berguna untuk audit */
    private const IGNORED = ['created_at', 'updated_at'];

    /**
     * @param array|null $before snapshot sebelum perubahan (lihat snapshot()); null untuk data baru
     */
    public function record(Model $entity, string $action, ?array $before = null, ?string $reason = null, array $meta = []): FinanceAuditLog {
        $type = self::ENTITY_TYPES[$entity::class] ?? throw new InvalidArgumentException('Entitas tidak diaudit: ' . $entity::class);
        $actor = Auth::user();

        return FinanceAuditLog::create([
            'entity_type' => $type,
            'entity_id'   => $entity->getKey(),
            'action'      => $action,
            'actor_id'    => $actor?->getKey(),
            'actor_name'  => $actor?->name,
            'before'      => $before,
            'after'       => $entity->exists ? $this->snapshot($entity->refresh()) : null,
            'reason'      => $reason,
            'meta'        => $meta ?: null,
            'ip_address'  => request()?->ip(),
            'created_at'  => now(),
        ]);
    }

    public function snapshot(Model $entity): array {
        return Arr::except($entity->attributesToArray(), array_merge(self::IGNORED, $entity->getHidden()));
    }
}
