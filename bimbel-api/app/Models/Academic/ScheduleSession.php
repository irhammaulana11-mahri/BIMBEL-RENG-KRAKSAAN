<?php

namespace App\Models\Academic;

use App\Models\Admin\Subject;
use App\Models\Admin\Tentor;
use App\Models\Academic\LearningLocation;
use App\Models\Academic\Schedule;
use App\Models\Academic\StudentAttendance;
use App\Models\Academic\TentorAttendance;
use App\Models\Academic\SessionActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ScheduleSession extends Model {
    use HasUuids;
    protected $table = 'academic.schedule_sessions';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'schedule_id', 'subject_id', 'tentor_id', 'location_id',
        'meeting_no', 'session_date', 'day_of_week',
        'start_time', 'end_time', 'room_name', 'meeting_url',
        'status', 'note', 'reason',
    ];

    public function schedule() {
        return $this->belongsTo(Schedule::class, 'schedule_id');
    }

    public function subject() {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function tentor() {
        return $this->belongsTo(Tentor::class, 'tentor_id');
    }

    public function location() {
        return $this->belongsTo(LearningLocation::class, 'location_id');
    }

    public function studentAttendances() {
        return $this->hasMany(StudentAttendance::class, 'session_id');
    }

    public function tentorAttendance() {
        return $this->hasOne(TentorAttendance::class, 'session_id', 'id');
    }

    public function activities() {
        return $this->hasMany(SessionActivity::class, 'schedule_session_id')
                    ->orderBy('display_order', 'asc');
    }
}