<?php

namespace App\Models\Website;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Testimonial extends Model {
    use HasUuids;
    protected $table = 'website.testimonials';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;
    protected $fillable = [
        'student_name',
        'school_name',
        'testimonial',
        'photo_url',
        'rating',
        'is_active'
    ];

    protected $casts = [
        'rating' => 'integer',
        'is_active' => 'boolean'
    ];
}