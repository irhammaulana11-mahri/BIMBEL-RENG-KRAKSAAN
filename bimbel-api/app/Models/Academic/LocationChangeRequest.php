<?php

namespace App\Models\Academic;

use App\Models\Admin\Student;
use App\Models\Admin\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class LocationChangeRequest extends Model
{
    use HasUuids;

    protected $table = 'academic.location_change_requests';

    public const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

    protected $fillable = [
        'session_id', 'requested_by', 'requester_type', 'student_id',
        'location_name', 'address', 'latitude', 'longitude',
        'reason', 'status', 'review_note', 'reviewed_by', 'reviewed_at',
    ];

    protected $casts = [
        'latitude'    => 'float',
        'longitude'   => 'float',
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
