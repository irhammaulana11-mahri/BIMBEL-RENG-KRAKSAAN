<?php

namespace App\Models\Admin;

use App\Models\Admin\Subject;
use App\Models\Admin\Student;
use App\Models\Academic\ClassRoom;
use App\Models\Website\Package; // Sesuaikan jika ada model Package
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Builder;


class EducationLevel extends Model
{
    use HasUuids;

    protected $table = 'master.education_levels'; // Sesuaikan skema Anda
    public $incrementing = false;

    protected $fillable = [
        'level_code',
        'education_level',
        'grade_level',
        'display_name',
        'sort_order',
        'is_active',
        'description',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'grade_level' => 'integer',
        'sort_order' => 'integer',
    ];

    // Relasi (Sesuaikan dengan foreign key dan nama model di project Anda)
    public function subjects() {
        return $this->hasMany(Subject::class, 'education_level_id');
    }

    public function classes() {
        return $this->hasMany(ClassRoom::class, 'education_level_id');
    }

    public function packages() {
        return $this->hasMany(Package::class, 'education_level_id');
    }

    public function students() {
        return $this->hasMany(Student::class, 'education_level_id');
    }

    
}