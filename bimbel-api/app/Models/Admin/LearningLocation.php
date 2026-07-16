<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class LearningLocation extends Model {
    use HasUuids;
    protected $table = 'academic.learning_locations';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = [
        'location_name',
        'location_type',
        'address',
        'latitude',
        'longitude',
        'radius_meter',
        'is_active'
    ];
}