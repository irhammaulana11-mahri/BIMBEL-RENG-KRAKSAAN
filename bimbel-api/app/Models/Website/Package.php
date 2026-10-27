<?php

namespace App\Models\Website;

use App\Models\Academic\ClassSubject;
use App\Models\Website\Lead;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Package extends Model {
    use HasUuids;
    protected $table = 'website.packages';
    protected $keyType = 'string';
    public $incrementing = false;
    // Sesuai kolom website.packages (kolom lama price/is_home_visit/card_color sudah tidak ada)
    protected $fillable = [
        'package_code',
        'package_name',
        'education_level',
        'description',
        'default_price',
        'meeting_per_month',
        'duration_minutes',
        'class_type',
        'display_order',
        'is_active',
    ];

    protected $casts = [
        'default_price'     => 'decimal:2',
        'meeting_per_month' => 'integer',
        'duration_minutes'  => 'integer',
        'display_order'     => 'integer',
        'is_active'         => 'boolean',
    ];

    public function leads() {
        return $this->hasMany(Lead::class,'package_id');
    }

    public function classes_subject() {
        return $this->hasMany(ClassSubject::class,'package_subject_id');
    }
}