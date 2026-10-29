<?php

namespace App\Models\Academic;

use App\Models\Admin\Student;
use App\Models\Admin\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * Koreksi absensi siswa yang sudah terkunci oleh tagihan/payroll (D-01). financial_effect menyimpan
 * dampak keuangan yang dihitung saat diajukan dan diperbarui saat disetujui.
 */
class AttendanceCorrection extends Model
{
    use HasUuids;

    protected $table = 'academic.attendance_corrections';

    public const STATUSES = ['PENDING', 'APPROVED', 'REJECTED'];
    public const ATTENDANCE_STATUSES = ['HADIR', 'IZIN', 'SAKIT', 'ALPA'];

    protected $fillable = [
        'session_id', 'student_id', 'student_attendance_id', 'old_status', 'new_status', 'reason', 'parent_request_note',
        'status', 'requested_by', 'requested_at', 'reviewed_by', 'reviewed_at', 'review_note', 'self_approved',
        'financial_effect', 'billing_resolution', 'payroll_resolution',
    ];

    protected $casts = [
        'financial_effect' => 'array',
        'self_approved'    => 'boolean',
        'requested_at'     => 'datetime',
        'reviewed_at'      => 'datetime',
    ];

    public function session() { return $this->belongsTo(ScheduleSession::class, 'session_id'); }
    public function student() { return $this->belongsTo(Student::class, 'student_id'); }
    public function requester() { return $this->belongsTo(User::class, 'requested_by'); }
    public function reviewer() { return $this->belongsTo(User::class, 'reviewed_by'); }
}
