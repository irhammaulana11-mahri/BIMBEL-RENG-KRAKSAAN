<?php

namespace App\Models\Finance;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/** Pengembalian dana ke orang tua atas kelebihan tagih yang sudah dibayar (dengan bukti). */
class Refund extends Model
{
    use HasUuids;

    protected $table = 'finance.refunds';
    protected $fillable = ['student_id', 'invoice_id', 'correction_id', 'amount', 'method', 'reference_no', 'proof_path', 'paid_by', 'paid_at', 'note'];
    protected $casts = ['amount' => 'decimal:2', 'paid_at' => 'datetime'];

    public function invoice() { return $this->belongsTo(Invoice::class, 'invoice_id'); }
}
