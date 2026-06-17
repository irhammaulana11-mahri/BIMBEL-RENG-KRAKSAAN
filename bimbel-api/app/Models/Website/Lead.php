<?php

namespace App\Models\Website;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Lead extends Model {
    use HasUuids;
    protected $table = 'website.leads';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;
    
    protected $fillable = [
        'full_name',
        'phone',
        'education_level',
        'package_id',
        'notes',
        'status'
    ];

    public function package() {
        return $this->belongsTo(Package::class,'package_id');
    }
}