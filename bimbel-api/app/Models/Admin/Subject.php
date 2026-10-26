<?php

namespace App\Models\Admin;


use App\Models\Admin\Tentor;
use App\Models\Admin\EducationLevel;
use App\Models\Academic\Curriculum;
use App\Models\Academic\Material;
use App\Models\Academic\Schedule;
use App\Models\Exam\Exam;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;



class Subject extends Model {
    use HasUuids;
    
    protected $table = 'master.subjects';
    protected $fillable = ['code', 'name', 'description', 'education_level_id', 'is_active'];
    protected $casts = ['is_active' => 'boolean'];

    public function educationLevel() {
        return $this->belongsTo(EducationLevel::class, 'education_level_id');
    }

    public function tentors() {
        return $this->belongsToMany(Tentor::class, 'master.tentor_subjects', 'subject_id', 'tentor_id');
    }

    public function curriculums() { // Plural karena satu mapel banyak kurikulum
        return $this->hasMany(Curriculum::class, 'subject_id');
    }

    // Mengambil Material milik Subject ini MELAUI Curriculum
    public function materials() {
        return $this->hasManyThrough(
            Material::class,     // Model tujuan akhir (Material)
            Curriculum::class,   // Model penghubung (Curriculum)
            'subject_id',        // Foreign key di tabel curriculums
            'curriculum_id',     // Foreign key di tabel materials
            'id',                // Local key di tabel subjects
            'id'                 // Local key di tabel curriculums
        );
    }

    public function schedules() {
        return $this->hasMany(Schedule::class, 'subject_id');
    }

    public function exams() {
        return $this->hasMany(Exam::class, 'subject_id');
    }
}