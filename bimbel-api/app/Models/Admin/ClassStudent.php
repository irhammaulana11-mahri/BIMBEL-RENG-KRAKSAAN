<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ClassStudent extends Model {
    use HasUuids;
    protected $table = 'academic.class_students';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['class_id','student_id'];

    public function classRoom() {
        return $this->belongsTo(ClassRoom::class,'class_id');
    }

    public function student() {
        return $this->belongsTo(Student::class);
    }
}