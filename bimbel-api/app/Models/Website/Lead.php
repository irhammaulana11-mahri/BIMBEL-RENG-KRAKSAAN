<?php

namespace App\Models\Website;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Lead extends Model {
    use HasUuids;
    protected $table = 'website.leads';
    protected $keyType = 'string';
    public $incrementing = false;
    
    protected $fillable = [
        'parent_name',
        'phone',
        'email',
        'student_name',
        'education_level',
        'package_id',
        'notes',
        'status',
        'user_id'
    ];

    public function package() {
        return $this->belongsTo(Package::class,'package_id');
    }
}