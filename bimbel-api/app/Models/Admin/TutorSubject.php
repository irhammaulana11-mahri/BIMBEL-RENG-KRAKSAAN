<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Admin\Tutor;

class TutorSubject extends Model {
    use HasUuids;
    protected $table = 'master.tutor_subjects';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['tutor_id','subject_id'];

    public function tutor() {
        return $this->belongsTo(Tutor::class);
    }

    public function subject() {
        return $this->belongsTo(Subject::class);
    }
}