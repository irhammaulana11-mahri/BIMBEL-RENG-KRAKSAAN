<?php

namespace App\Models\Website;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Package extends Model {
    use HasUuids;
    protected $table = 'website.packages';
    protected $keyType = 'string';
    public $incrementing = false;
    protected $fillable = [
        'package_name',
        'education_level',
        'description',
        'price',
        'meeting_per_month',
        'duration_minutes',
        'is_home_visit',
        'is_building_class',
        'is_active',
        'card_color',
    ];

    protected $casts = [
        'price' => 'decimal:2',
        'is_home_visit' => 'boolean',
        'is_building_class' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function leads() {
        return $this->hasMany(Lead::class,'package_id');
    }
}