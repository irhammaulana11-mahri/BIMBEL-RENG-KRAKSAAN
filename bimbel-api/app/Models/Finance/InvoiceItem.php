<?php

namespace App\Models\Finance;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class InvoiceItem extends Model
{
    use HasUuids;

    protected $table = 'finance.invoice_items';

    // PACKAGE = biaya paket bulanan, lainnya untuk tagihan manual
    public const TYPES = ['PACKAGE', 'REGISTRATION', 'MODULE', 'OTHER'];

    protected $fillable = [
        'invoice_id', 'package_id', 'curriculum_id', 'reference_no', 'item_type',
        'item_name', 'description', 'quantity', 'unit_price', 'discount', 'subtotal', 'sort_order',
    ];

    protected $casts = [
        'quantity'   => 'integer',
        'unit_price' => 'decimal:2',
        'discount'   => 'decimal:2',
        'subtotal'   => 'decimal:2',
        'sort_order' => 'integer',
    ];

    public function invoice() { return $this->belongsTo(Invoice::class, 'invoice_id'); }
}
