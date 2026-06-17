<?php

namespace App\Models\Website;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Banner extends Model {
    use HasUuids;
    protected $table = 'website.banners';
    protected $keyType = 'string';
    public $incrementing = false;
    protected $fillable = ['title','subtitle','image_url','button_text','button_link','sort_order','is_active',
        'start_date','end_date'
    ];

    protected $casts = ['is_active' => 'boolean','start_date' => 'date','end_date' => 'date',];
}