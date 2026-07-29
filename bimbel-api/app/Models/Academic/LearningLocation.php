<?php

namespace App\Models\Academic;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class LearningLocation extends Model {
    use HasUuids;
    protected $table = 'academic.learning_locations';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = [
        'location_name',
        'code',
        'address',
        'latitude',
        'longitude',
        'radius_meter',
        'description',
        'is_active',
        'meeting_url',
        'contact_person',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'radius_meter' => 'integer',
        'is_active' => 'boolean',
    ];

    // | RELATIONSHIPS
    public function schedules() {
        return $this->hasMany(Schedule::class,'location_id');
    }
}