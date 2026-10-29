<?php

namespace App\Models\Finance;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/** Saldo kredit siswa dari kelebihan tagih; dipakai otomatis pada tagihan reguler berikutnya. */
class CreditNote extends Model
{
    use HasUuids;

    protected $table = 'finance.credit_notes';
    protected $fillable = ['student_id', 'source_invoice_id', 'correction_id', 'amount', 'remaining_amount', 'note', 'created_by'];
    protected $casts = ['amount' => 'decimal:2', 'remaining_amount' => 'decimal:2'];

    public function sourceInvoice() { return $this->belongsTo(Invoice::class, 'source_invoice_id'); }
    public function applications() { return $this->hasMany(CreditApplication::class, 'credit_note_id'); }
}
