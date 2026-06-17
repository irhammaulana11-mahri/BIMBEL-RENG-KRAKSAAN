<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Subject;

class Tutor extends Model {
    use HasUuids;
    protected $table = 'master.tutors';
    protected $keyType = 'string';
    public $incrementing = false;
    protected $fillable = ['user_id','specialization','education','joining_date','nik','gender','birth_date','address',
        'latitude','longitude'
    ];

    public function user() {
        return $this->belongsTo(User::class,'user_id');
    }

    public function subjects() {
        return $this->belongsToMany(Subject::class,'master.tutor_subjects','tutor_id','subject_id');
    }
}