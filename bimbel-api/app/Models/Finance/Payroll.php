<?php

namespace App\Models\Finance;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Payroll extends Model
{
    use HasUuids;

    protected $table = 'finance.payrolls';

    public const STATUSES = ['DRAFT', 'APPROVED', 'PAID'];

    protected $fillable = [
        'payroll_no', 'period_month', 'period_year', 'payroll_date',
        'total_tutors', 'total_sessions', 'total_teaching_minutes', 'total_amount',
        'status', 'note', 'approved_at', 'paid_at', 'created_by', 'approved_by',
    ];

    protected $casts = [
        'period_month'           => 'integer',
        'period_year'            => 'integer',
        'payroll_date'           => 'date',
        'total_tutors'           => 'integer',
        'total_sessions'         => 'integer',
        'total_teaching_minutes' => 'integer',
        'total_amount'           => 'decimal:2',
        'approved_at'            => 'datetime',
        'paid_at'                => 'datetime',
    ];

    public function details() { return $this->hasMany(PayrollDetail::class, 'payroll_id'); }
    public function transfers() { return $this->hasMany(PayrollTransfer::class, 'payroll_id'); }
}
