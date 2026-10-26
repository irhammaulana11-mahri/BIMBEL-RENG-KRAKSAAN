<?php

namespace App\Models\Exam;

use App\Models\Academic\SessionActivity;
use App\Models\Admin\Student;
use App\Models\Admin\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ExamResult extends Model
{
    use HasUuids;

    protected $table = 'exam.exam_results';

    public const STATUSES = ['IN_PROGRESS', 'SUBMITTED', 'GRADED'];

    protected $fillable = [
        'exam_id',
        'student_id',
        'session_activity_id',
        'score',
        'total_correct',
        'total_wrong',
        'total_unanswered',
        'started_at',
        'expires_at',
        'submitted_at',
        'graded_at',
        'graded_by',
        'duration_seconds',
        'status',
        'feedback',
    ];

    protected $casts = [
        'score'            => 'decimal:2',
        'total_correct'    => 'integer',
        'total_wrong'      => 'integer',
        'total_unanswered' => 'integer',
        'duration_seconds' => 'integer',
        'started_at'       => 'datetime',
        'expires_at'       => 'datetime',
        'submitted_at'     => 'datetime',
        'graded_at'        => 'datetime',
    ];

    public function exam()
    {
        return $this->belongsTo(Exam::class, 'exam_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function sessionActivity()
    {
        return $this->belongsTo(SessionActivity::class, 'session_activity_id');
    }

    public function answers()
    {
        return $this->hasMany(ExamAnswer::class, 'exam_result_id');
    }

    public function grader()
    {
        return $this->belongsTo(User::class, 'graded_by');
    }

    public function isExpired(): bool
    {
        return $this->status === 'IN_PROGRESS' && $this->expires_at && now()->greaterThanOrEqualTo($this->expires_at);
    }
}
