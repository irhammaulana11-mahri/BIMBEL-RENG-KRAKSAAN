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
        'teaching_minutes', 'is_payroll_processed', 'note',
        'target_label', 'target_latitude', 'target_longitude', 'target_radius_meter',
        'checkin_latitude', 'checkin_longitude', 'checkin_accuracy_meter', 'checkin_distance_meter',
        'checkin_outside_area', 'checkin_outside_time',
        'checkout_latitude', 'checkout_longitude', 'checkout_accuracy_meter', 'checkout_distance_meter',
        'checkout_outside_area', 'checkout_outside_time', 'early_leave_minutes',
        'checkin_source',
    ];

    protected $casts = [
        'checked_in_at'        => 'datetime',
        'checked_out_at'       => 'datetime',
        'is_payroll_processed' => 'boolean',
        'target_latitude'      => 'float',
        'target_longitude'     => 'float',
        'checkin_latitude'     => 'float',
        'checkin_longitude'    => 'float',
        'checkout_latitude'    => 'float',
        'checkout_longitude'   => 'float',
        'checkin_outside_area' => 'boolean',
        'checkin_outside_time' => 'boolean',
        'checkout_outside_area' => 'boolean',
        'checkout_outside_time' => 'boolean',
    ];

    public function session() {
        return $this->belongsTo(ScheduleSession::class, 'session_id', 'id');
    }

    public function tentor() {
        return $this->belongsTo(Tentor::class, 'tentor_id', 'id');
    }
}
