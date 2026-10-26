<?php

namespace App\Models\Academic;

use App\Models\Admin\Subject;
use App\Models\Admin\Tentor;
use App\Models\Academic\ClassRoom;
use App\Models\Website\Package;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ClassSubject extends Model {
    use HasUuids;

    protected $table = 'academic.class_subjects';
    public $incrementing = false;
    protected $keyType = 'string';

    protected $fillable = [
        'class_id',
        'package_subject_id',
        'subject_id',
        'tentor_id',
        'meeting_target',
        'display_order',
        'status',
    ];

    public function classRoom() {
        return $this->belongsTo(ClassRoom::class, 'class_id');
    }

    public function subject() {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function tentor() {
        return $this->belongsTo(Tentor::class, 'tentor_id');
    }

    public function packageSubject() {
        return $this->belongsTo(Package::class, 'package_subject_id');
    }
    
}