<?php

namespace App\Models\Finance;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class OperationalExpense extends Model
{
    use HasUuids;

    protected $table = 'finance.operational_expenses';

    public const CATEGORIES = [
        'SEWA_GEDUNG'  => 'Sewa & Gedung',
        'UTILITAS'     => 'Listrik, Air & Internet',
        'ATK_MODUL'    => 'ATK & Modul',
        'PEMASARAN'    => 'Pemasaran',
        'PERAWATAN'    => 'Perawatan & Perbaikan',
        'TRANSPORTASI' => 'Transportasi',
        'GAJI_STAF'    => 'Gaji Staf Non-Tentor',
        'LAINNYA'      => 'Lainnya',
    ];

    protected $fillable = [
        'expense_date', 'category', 'title', 'amount', 'payment_method', 'note', 'created_by',
    ];

    protected $casts = [
        'expense_date' => 'date',
        'amount'       => 'decimal:2',
    ];
}
