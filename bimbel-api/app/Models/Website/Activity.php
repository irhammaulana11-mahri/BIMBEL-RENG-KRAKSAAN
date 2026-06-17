<?php

namespace App\Models\Website;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Activity extends Model {
    use HasUuids;
    protected $table = 'website.activities';
    protected $keyType = 'string';
    public $incrementing = false;
    protected $fillable = [
        'title',
        'description',
        'activity_date',
        'location',
        'cover_image',
        'is_active',
    ];

    protected $casts = ['activity_date' => 'date'];

    public function images() {
        return $this->hasMany(ActivityImage::class,'activity_id');
    }
}