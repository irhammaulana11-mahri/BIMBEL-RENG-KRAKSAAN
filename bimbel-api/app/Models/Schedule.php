<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Schedule extends Model {
    use HasUuids;
    protected $table = 'academic.schedules';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['tutor_id','subject_id','class_id','location_id','day_of_week','start_time',
        'end_time','room_name','status'
    ];

    public function tutor() {
        return $this->belongsTo(Tutor::class);
    }

    public function subject() {
        return $this->belongsTo(Subject::class);
    }

    public function classRoom() {
        return $this->belongsTo(ClassRoom::class, 'class_id');
    }

    public function location() {
        return $this->belongsTo(LearningLocation::class,'location_id');
    }

    public function students() {
        return $this->belongsToMany(Student::class,'academic.schedule_students','schedule_id','student_id');
    }    

    public function scheduleStudents() {
        return $this->hasMany(ScheduleStudent::class,'schedule_id');
    }
}