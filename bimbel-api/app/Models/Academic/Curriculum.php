<?php

namespace App\Models\Academic;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Admin\Subject;
use App\Models\Admin\EducationLevel;

class Curriculum extends Model {
    use HasUuids;

    protected $table = 'academic.curriculums';
    
    protected $fillable = [
        'subject_id',
        'title',
        'description',
        'education_level',
        'education_level_id',
        'semester',
        'order_no',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'semester' => 'integer',
        'order_no' => 'integer',
    ];

    public function subject() {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function educationLevel() {
        return $this->belongsTo(EducationLevel::class, 'education_level_id');
    }

    public function materials() {
        return $this->hasMany(Material::class, 'curriculum_id');
    }
}