<?php

namespace App\Models\Finance;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/** Pemakaian saldo kredit pada satu tagihan; dihitung sebagai terbayar oleh InvoiceService::recalculate. */
class CreditApplication extends Model
{
    use HasUuids;

    protected $table = 'finance.credit_applications';
    protected $fillable = ['credit_note_id', 'invoice_id', 'amount', 'created_by'];
    protected $casts = ['amount' => 'decimal:2'];

    public function creditNote() { return $this->belongsTo(CreditNote::class, 'credit_note_id'); }
    public function invoice() { return $this->belongsTo(Invoice::class, 'invoice_id'); }
}
