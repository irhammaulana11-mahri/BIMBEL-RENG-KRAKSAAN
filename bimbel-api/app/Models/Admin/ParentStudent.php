<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ParentStudent extends Model {
    use HasUuids;
    protected $table = 'master.parent_students';
    public $timestamps = false;
    protected $fillable = ['parent_id','student_id'];
}