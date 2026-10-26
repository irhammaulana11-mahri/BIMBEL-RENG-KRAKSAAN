<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Admin\Subject;
use App\Models\Admin\User;
use App\Models\Academic\Schedule;
use App\Models\Academic\ScheduleSession;


class Tentor extends Model {
    use HasUuids;
    protected $table = 'master.tentors';
    protected $keyType = 'string';
    public $incrementing = false;
    protected $fillable = [
        'user_id',
        'specialization',
        'education',
        'joining_date',
        'nik',
        'gender',
        'birth_date',
        'address',
        'latitude',
        'longitude',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'birth_date' => 'date',
        'joining_date' => 'date',
    ];

    public function user() {
        return $this->belongsTo(User::class,'user_id');
    }

    public function subjects() {
        return $this->belongsToMany(Subject::class,'master.tentor_subjects','tentor_id','subject_id');
    }

    public function schedules() {
        return $this->hasMany(Schedule::class,'tentor_id');
    }

    public function sessions() {
        return $this->hasMany(ScheduleSession::class,'tentor_id');
    }
}