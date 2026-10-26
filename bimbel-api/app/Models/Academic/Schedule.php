<?php

namespace App\Models\Academic;

use App\Models\Admin\Subject;
use App\Models\Admin\Tentor;
use App\Models\Academic\ClassRoom;
use App\Models\Academic\LearningLocation;
use App\Models\Admin\Student;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Schedule extends Model {
    use HasUuids;
    protected $table = 'academic.schedules';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = [
        'class_id',
        'subject_id',
        'tentor_id',
        'location_id',
        'room_name',
        'meeting_url',
        'day_of_week',
        'start_time',
        'end_time',
        'is_active',
        'status'
    ];
    protected $casts = ['is_active'=>'boolean','day_of_week'=>'integer',];


    public function tentor() {
        return $this->belongsTo(Tentor::class);
    }

    public function subject() {
        return $this->belongsTo(Subject::class);
    }

    public function classroom() {
        return $this->belongsTo(ClassRoom::class, 'class_id');
    }

    public function location() {
        return $this->belongsTo(LearningLocation::class,'learning_location_id');
    }

    public function students() {
        return $this->belongsToMany(Student::class,'academic.schedule_students','schedule_id','student_id');
    }    

    public function scheduleStudents() {
        return $this->hasMany(ScheduleStudent::class,'schedule_id');
    }

    public function sessions() { 
        return $this->hasMany(ScheduleSession::class, 'schedule_id')->orderBy('session_date'); 
    }
}