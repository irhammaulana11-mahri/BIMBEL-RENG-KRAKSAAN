<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Admin\Tentor;

class Subject extends Model {
    use HasUuids;
    protected $table = 'master.subjects';
    protected $fillable = ['code','name','description','education_level','is_active'];
    protected $casts = ['is_active' => 'boolean',];

    public function tentors() {
        return $this->belongsToMany(Tentor::class,'master.tentor_subjects','subject_id','tentor_id');
    }

    public function curriculum() {
        return $this->hasMany(Curriculum::class,'subject_id');
    }

    public function materials() {
        return $this->hasMany(Material::class,'subject_id');
    }

    public function schedules() {
        return $this->hasMany(Schedule::class,'subject_id');
    }

    public function exams() {
        return $this->hasMany(Exam::class,'subject_id');
    }
}
