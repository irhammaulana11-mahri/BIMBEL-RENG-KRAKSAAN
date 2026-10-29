<?php

namespace App\Models\Finance;

use App\Models\Admin\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class PaymentReversal extends Model
{
    use HasUuids;

    protected $table = 'finance.payment_reversals';

    public const STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];

    protected $fillable = [
        'payment_id', 'amount', 'reason', 'status', 'requested_by', 'requested_at',
        'approved_by', 'approved_at', 'approval_note', 'self_approved',
        'rejected_by', 'rejected_at', 'reject_note',
    ];

    protected $casts = [
        'amount'        => 'decimal:2',
        'self_approved' => 'boolean',
        'requested_at'  => 'datetime',
        'approved_at'   => 'datetime',
        'rejected_at'   => 'datetime',
    ];

    public function payment() { return $this->belongsTo(Payment::class, 'payment_id'); }
    public function requester() { return $this->belongsTo(User::class, 'requested_by'); }
    public function approver() { return $this->belongsTo(User::class, 'approved_by'); }
    public function rejecter() { return $this->belongsTo(User::class, 'rejected_by'); }
}
