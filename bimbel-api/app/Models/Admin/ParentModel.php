<?php

namespace App\Models\Admin;

use App\Models\Admin\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ParentModel extends Model {
    use HasUuids;
    protected $table = 'master.parents';
    protected $keyType = 'string';
    public $incrementing = false;
    protected $fillable = ['user_id','full_name','occupation','relationship','address'];


    public function user() {
        return $this->belongsTo(User::class,'user_id');
    }

    public function students() {
        return $this->belongsToMany(Student::class,'master.parent_students','parent_id','student_id');
    }
}