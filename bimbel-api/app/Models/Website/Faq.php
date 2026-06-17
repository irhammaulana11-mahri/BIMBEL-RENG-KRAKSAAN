<?php

namespace App\Models\Website;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Faq extends Model {
    use HasUuids;
    protected $table = 'website.faqs';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;
    protected $fillable = [
        'question',
        'answer',
        'sort_order',
        'is_active'
    ];

    protected $casts = [
        'sort_order' => 'integer',
        'is_active' => 'boolean'
    ];
}