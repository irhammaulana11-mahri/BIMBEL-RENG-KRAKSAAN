<?php

namespace App\Models\Admin;

use App\Models\Admin\ParentModel;
use App\Models\Admin\User;
use App\Models\Academic\ClassRoom;
use App\Models\Academic\Schedule;
use App\Models\Academic\ScheduleStudent;
use App\Models\Admin\EducationLevel;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;


class Student extends Model {
    use HasUuids;
    protected $table = 'master.students';
    protected $keyType = 'string';
    public $incrementing = false;
    protected $fillable = ['user_id', 'full_name','nis','gender','birth_date', 'education_level','school_name','grade','is_active',];
    
    
    public function user() {
        return $this->belongsTo(User::class,'user_id');
    }

    // public function parent() {
    //     return $this->belongsTo(ParentModel::class,'parent_id');
    // }

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

    public function educationLevel() {
        return $this->belongsTo(EducationLevel::class,'education_level_id');
    }
    
}