<?php

namespace App\Models\Academic;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ScheduleStudent extends Model {
    use HasUuids;
    protected $table = 'academic.schedule_students';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['schedule_id','student_id'];

    public function schedule() {
        return $this->belongsTo(Schedule::class);
    }

    public function student() {
        return $this->belongsTo(Student::class);
    }
}