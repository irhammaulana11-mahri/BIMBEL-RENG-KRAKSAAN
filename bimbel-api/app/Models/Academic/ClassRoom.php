<?php

namespace App\Models\Academic;

use App\Models\Admin\Student;
use App\Models\Website\Package;
use App\Models\Academic\LearningLocation;
use App\Models\Admin\EducationLevel;
use App\Models\Academic\ClassStudent;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ClassRoom extends Model {
    use HasUuids;
    protected $table = 'academic.classes';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = [
        'code',
        'name',
        'education_level',
        'education_level_id',
        'class_type',
        'package_id',
        'learning_location_id',
        'meeting_per_month',   
        'duration_minutes',
        'max_students',
        'description',
        'is_active',
        'status',
    ];

    public function students() {
        return $this->belongsToMany(Student::class,'academic.class_students','class_id','student_id');
    }

    public function classStudents() {
        return $this->hasMany(ClassStudent::class, 'class_id');
    }

    public function classSubjects() {
        return $this->hasMany(ClassSubject::class, 'class_id')->orderBy('display_order', 'asc');
    }

    public function educationlevel() {
        return $this->belongsTo(EducationLevel::class, 'education_level_id');
    }
    
    public function schedules() {
        return $this->hasMany(Schedule::class,'class_id');
    }

    public function location() {
        return $this->belongsTo(LearningLocation::class, 'learning_location_id');
    }

    public function package() {
        return $this->belongsTo(Package::class, 'package_id');
    }
}