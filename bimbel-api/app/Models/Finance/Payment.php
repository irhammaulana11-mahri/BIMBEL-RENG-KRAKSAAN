<?php

namespace App\Models\Finance;

use App\Models\Admin\Student;
use App\Models\Admin\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Payment extends Model
{
    use HasUuids;

    protected $table = 'finance.payments';

    public const STATUSES = ['PENDING', 'CONFIRMED', 'REJECTED'];
    public const METHODS = ['CASH', 'TRANSFER'];

    protected $fillable = [
        'student_id', 'payment_no', 'payment_date', 'payment_method', 'payment_channel',
        'reference_no', 'total_amount', 'status', 'received_by', 'submitted_by',
        'note', 'payment_proof', 'reject_reason', 'confirmed_at',
    ];

    protected $casts = [
        'payment_date' => 'date',
        'total_amount' => 'decimal:2',
        'confirmed_at' => 'datetime',
    ];

    public function student() { return $this->belongsTo(Student::class, 'student_id'); }
    public function details() { return $this->hasMany(PaymentDetail::class, 'payment_id'); }
    public function receiver() { return $this->belongsTo(User::class, 'received_by'); }
    public function submitter() { return $this->belongsTo(User::class, 'submitted_by'); }
}
