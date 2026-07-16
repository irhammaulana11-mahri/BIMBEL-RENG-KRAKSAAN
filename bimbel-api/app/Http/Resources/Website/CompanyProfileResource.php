<?php

namespace App\Http\Resources\Website;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CompanyProfileResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
{
    return [
        'id' => $this->id,
        'company_name' => $this->company_name,
        'address' => $this->address,
        'phone' => $this->phone,
        'whatsapp' => $this->whatsapp,
        'email' => $this->email,
        'website_url' => $this->website_url,
        'facebook_url' => $this->facebook_url,
        'instagram_url' => $this->instagram_url,
        'youtube_url' => $this->youtube_url,
        'latitude' => $this->latitude,
        'longitude' => $this->longitude,
        'created_at' => $this->created_at,
        'logo_url' => $this->logo_url,
    ];
}
}
