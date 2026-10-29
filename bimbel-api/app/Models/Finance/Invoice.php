<?php

namespace App\Models\Finance;

use App\Models\Academic\ClassRoom;
use App\Models\Admin\Student;
use App\Models\Website\Package;
use App\Support\LocalTime;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Invoice extends Model
{
    use HasUuids;

    protected $table = 'finance.invoices';

    public const STATUSES = ['UNPAID', 'PARTIAL', 'PAID', 'CANCELLED'];

    protected $fillable = [
        'student_id', 'package_id', 'class_id', 'invoice_no',
        'issue_date', 'due_date', 'period_month', 'period_year',
        'subtotal', 'discount', 'total_amount', 'paid_amount', 'remaining_amount',
        'status', 'note', 'cancel_reason', 'created_by',
        'invoice_type', 'adjusts_invoice_id', 'correction_id',
    ];

    /** REGULAR: tagihan bulanan/manual; ADJUSTMENT: tagihan penyesuaian dari koreksi absensi (tanpa periode) */
    public const TYPES = ['REGULAR', 'ADJUSTMENT'];

    protected $casts = [
        'issue_date'       => 'date',
        'due_date'         => 'date',
        'period_month'     => 'integer',
        'period_year'      => 'integer',
        'subtotal'         => 'decimal:2',
        'discount'         => 'decimal:2',
        'total_amount'     => 'decimal:2',
        'paid_amount'      => 'decimal:2',
        'remaining_amount' => 'decimal:2',
    ];

    public function student() { return $this->belongsTo(Student::class, 'student_id'); }
    public function classroom() { return $this->belongsTo(ClassRoom::class, 'class_id'); }
    public function package() { return $this->belongsTo(Package::class, 'package_id'); }
    public function items() { return $this->hasMany(InvoiceItem::class, 'invoice_id')->orderBy('sort_order'); }
    public function paymentDetails() { return $this->hasMany(PaymentDetail::class, 'invoice_id'); }
    public function creditApplications() { return $this->hasMany(CreditApplication::class, 'invoice_id'); }
    public function refunds() { return $this->hasMany(Refund::class, 'invoice_id'); }
    public function adjustedInvoice() { return $this->belongsTo(Invoice::class, 'adjusts_invoice_id'); }

    public function isOverdue(): bool
    {
        return in_array($this->status, ['UNPAID', 'PARTIAL'])
            && $this->due_date
            && $this->due_date->toDateString() < LocalTime::today();
    }
}
