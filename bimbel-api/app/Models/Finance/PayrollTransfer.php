<?php

namespace App\Models\Finance;

use App\Models\Admin\Tentor;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PayrollTransfer extends Model
{
    use HasUuids;

    protected $table = 'finance.payroll_transfers';

    protected $fillable = [
        'payroll_id', 'tentor_id', 'amount', 'transfer_date',
        'source_account', 'reference_no', 'note', 'paid_by',
        'proof_path', 'approval_note', 'self_approved', 'receipt_status', 'receipt_note', 'receipt_at',
    ];

    public const RECEIPT_STATUSES = ['RECEIVED', 'DISPUTED'];

    protected $casts = [
        'amount'        => 'decimal:2',
        'transfer_date' => 'date',
        'self_approved' => 'boolean',
        'receipt_at'    => 'datetime',
    ];

    public function payroll() { return $this->belongsTo(Payroll::class, 'payroll_id'); }
    public function tentor() { return $this->belongsTo(Tentor::class, 'tentor_id'); }
    public function payer() { return $this->belongsTo(\App\Models\Admin\User::class, 'paid_by'); }
}
