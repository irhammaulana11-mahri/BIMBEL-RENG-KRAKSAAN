<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ClassRoom extends Model {
    use HasUuids;
    protected $table = 'academic.classes';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['class_name','level','description'];

    public function students() {
        return $this->belongsToMany(Student::class,'academic.class_students','class_id','student_id');
    }
}