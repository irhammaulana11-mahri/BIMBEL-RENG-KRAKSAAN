<?php

namespace App\Models\Finance;

use App\Models\Admin\Tentor;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * Penyesuaian honor dari koreksi absensi pada payroll yang sudah disetujui/dibayar:
 * ADDITION (kurang bayar) dan DEDUCTION (lebih bayar) masuk payroll berikutnya yang disusun;
 * RECOVERY = permintaan pengembalian dana ke tentor, bisa diselesaikan (SETTLED) atau diubah jadi DEDUCTION.
 */
class PayrollAdjustment extends Model
{
    use HasUuids;

    protected $table = 'finance.payroll_adjustments';

    public const KINDS = ['ADDITION', 'DEDUCTION', 'RECOVERY'];

    protected $fillable = [
        'tentor_id', 'correction_id', 'source_payroll_id', 'kind', 'amount', 'remaining_amount', 'status',
        'note', 'settled_by', 'settled_at', 'settle_reference',
    ];
    protected $casts = ['amount' => 'decimal:2', 'remaining_amount' => 'decimal:2', 'settled_at' => 'datetime'];

    public function tentor() { return $this->belongsTo(Tentor::class, 'tentor_id'); }
    public function sourcePayroll() { return $this->belongsTo(Payroll::class, 'source_payroll_id'); }
}
