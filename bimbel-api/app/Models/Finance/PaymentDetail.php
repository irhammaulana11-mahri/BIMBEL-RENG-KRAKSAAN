<?php

namespace App\Models\Finance;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PaymentDetail extends Model
{
    use HasUuids;

    protected $table = 'finance.payment_details';

    protected $fillable = ['payment_id', 'invoice_id', 'amount_paid', 'note', 'allocated_at'];

    protected $casts = [
        'amount_paid'  => 'decimal:2',
        'allocated_at' => 'datetime',
    ];

    public function payment() { return $this->belongsTo(Payment::class, 'payment_id'); }
    public function invoice() { return $this->belongsTo(Invoice::class, 'invoice_id'); }
}
