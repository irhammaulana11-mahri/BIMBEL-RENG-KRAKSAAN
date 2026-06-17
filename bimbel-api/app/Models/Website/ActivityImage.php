<?php

namespace App\Models\Website;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ActivityImage extends Model {
    use HasUuids;
    protected $table = 'website.activity_images';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;
    protected $fillable = [
        'activity_id',
        'image_url'
    ];

    public function activity() {
        return $this->belongsTo(Activity::class,'activity_id');
    }
}