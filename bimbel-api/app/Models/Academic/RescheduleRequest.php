<?php

namespace App\Models\Academic;

use App\Models\Admin\Student;
use App\Models\Admin\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class RescheduleRequest extends Model
{
    use HasUuids;

    protected $table = 'academic.reschedule_requests';

    public const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

    protected $fillable = [
        'session_id', 'requested_by', 'requester_type', 'student_id',
        'original_date', 'original_start_time',
        'proposed_date', 'proposed_start_time', 'proposed_end_time',
        'reason', 'status', 'review_note', 'reviewed_by', 'reviewed_at',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
    ];

    public function session()
    {
        return $this->belongsTo(ScheduleSession::class, 'session_id');
    }

    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
