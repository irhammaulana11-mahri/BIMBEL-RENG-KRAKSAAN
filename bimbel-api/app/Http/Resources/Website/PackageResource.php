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
            'default_price' => $this->default_price,
            'meeting_per_month' => $this->meeting_per_month,
            'duration_minutes' => $this->duration_minutes,
            'is_active' => $this->is_active,
            'class_type' => $this->class_type,
            'created_at' => $this->created_at?->format('Y-m-d H:i:s'),
            'updated_at' => $this->updated_at?->format('Y-m-d H:i:s'),
        ];
    }
}