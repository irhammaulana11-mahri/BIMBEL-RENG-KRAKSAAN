<?php
namespace App\Models\Academic;

use App\Models\Academic\ScheduleSession;
use App\Models\Admin\Student;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class StudentAttendance extends Model {
    use HasUuids;
    protected $table = 'academic.student_attendances'; // Sesuai screenshot

    // Status yang disimpan. "BELUM" tidak disimpan, artinya record tidak ada.
    public const STATUSES = ['HADIR', 'IZIN', 'SAKIT', 'ALPA'];

    protected $fillable = [
        'session_id', 'student_id', 'attendance_status',
        'checked_in_at', 'checked_out_at', 'late_minutes', 'note'
    ];

    public function session() { return $this->belongsTo(ScheduleSession::class, 'session_id'); }
    public function student() { return $this->belongsTo(Student::class, 'student_id'); }
}
