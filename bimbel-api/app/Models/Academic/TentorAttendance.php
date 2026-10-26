<?php
namespace App\Models\Academic;

use App\Models\Academic\ScheduleSession;
use App\Models\Admin\Tentor;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class TentorAttendance extends Model {
    use HasUuids;
    protected $table = 'academic.tentor_attendances';

    public const STATUSES = ['HADIR', 'IZIN', 'SAKIT', 'ALPA'];

    protected $fillable = [
        'session_id', 'tentor_id', 'attendance_status',
        'checked_in_at', 'checked_out_at', 'late_minutes',
        'teaching_minutes', 'is_payroll_processed', 'note'
    ];

    protected $casts = [
        'checked_in_at'        => 'datetime',
        'checked_out_at'       => 'datetime',
        'is_payroll_processed' => 'boolean',
    ];

    public function session() {
        return $this->belongsTo(ScheduleSession::class, 'session_id', 'id');
    }

    public function tentor() {
        return $this->belongsTo(Tentor::class, 'tentor_id', 'id');
    }
}
