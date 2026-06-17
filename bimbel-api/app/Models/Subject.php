<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Tutor;

class Subject extends Model {
    use HasUuids;
    protected $table = 'master.subjects';
    protected $fillable = ['code','name','description'];

    public function tutors() {
        return $this->belongsToMany(Tutor::class,'master.tutor_subjects','subject_id','tutor_id');
    }
}
