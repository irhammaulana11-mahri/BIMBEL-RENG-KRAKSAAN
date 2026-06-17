<?php

namespace App\Models\Website;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class CompanyProfile extends Model {
    use HasUuids;
    protected $table = 'website.company_profiles';
    protected $keyType = 'string';
    public $incrementing = false;
    protected $fillable = ['company_name','address','phone','whatsapp','email','website_url','facebook_url',
        'instagram_url','youtube_url','latitude','longitude','logo_url'
    ];
    public function getRouteKeyName(): string {
        return 'id';
    }
}