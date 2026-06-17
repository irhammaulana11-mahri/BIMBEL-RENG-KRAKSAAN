<?php

namespace App\Http\Resources\Website;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PackageResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id' => $this->id,
            'package_name' => $this->package_name,
            'education_level' => $this->education_level,
            'description' => $this->description,
            'price' => $this->price,
            'meeting_per_month' => $this->meeting_per_month,
            'duration_minutes' => $this->duration_minutes,
            'is_home_visit' => $this->is_home_visit,
            'is_building_class' => $this->is_building_class,
            'is_active' => $this->is_active,
            'card_color' => $this->card_color,
        ];
    }
}