<?php

namespace App\Models;

use App\Models\ParentModel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Student extends Model {
    use HasUuids;
    protected $table = 'master.students';
    protected $keyType = 'string';
    public $incrementing = false;
    protected $fillable = ['user_id','nis','gender','birth_date','school_name','grade','address'];

    public function user() {
        return $this->belongsTo(User::class,'user_id');
    }

    public function parents() {
        return $this->belongsToMany(ParentModel::class,'master.parent_students','student_id','parent_id');
    }

    public function classes() {
        return $this->belongsToMany(ClassRoom::class,'academic.class_students','student_id','class_id');
    }

    public function schedules() {
        return $this->belongsToMany(Schedule::class,'academic.schedule_students','student_id','schedule_id');
    }

    public function scheduleStudents() {
        return $this->hasMany(ScheduleStudent::class,'student_id');
    }
}