<?php

namespace App\Models\Academic;

use App\Models\Admin\Student;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ClassRoom extends Model {
    use HasUuids;
    protected $table = 'academic.classes';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['code','name','education_level','class_type','max_students','description','is_active',];

    public function students() {
        return $this->belongsToMany(Student::class,'academic.class_students','class_id','student_id');
    }

    public function schedules() {
        return $this->hasMany(Schedule::class,'class_id');
    }
}