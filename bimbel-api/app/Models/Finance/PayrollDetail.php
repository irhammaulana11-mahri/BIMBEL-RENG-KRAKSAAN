<?php

namespace App\Models\Finance;

use App\Models\Academic\ScheduleSession;
use App\Models\Academic\TentorAttendance;
use App\Models\Admin\Tentor;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PayrollDetail extends Model
{
    use HasUuids;

    protected $table = 'finance.payroll_details';

    protected $fillable = [
        'payroll_id', 'tentor_id', 'tentor_attendance_id', 'session_id',
        'teaching_minutes', 'rate_per_session', 'rate_per_hour', 'subtotal', 'note',
    ];

    protected $casts = [
        'teaching_minutes' => 'integer',
        'rate_per_session' => 'decimal:2',
        'rate_per_hour'    => 'decimal:2',
        'subtotal'         => 'decimal:2',
    ];

    public function payroll() { return $this->belongsTo(Payroll::class, 'payroll_id'); }
    public function tentor() { return $this->belongsTo(Tentor::class, 'tentor_id'); }
    public function attendance() { return $this->belongsTo(TentorAttendance::class, 'tentor_attendance_id'); }
    public function session() { return $this->belongsTo(ScheduleSession::class, 'session_id'); }
}
