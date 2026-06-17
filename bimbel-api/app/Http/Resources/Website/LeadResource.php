<?php

namespace App\Http\Resources\Website;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'phone' => $this->phone,
            'education_level' => $this->education_level,
            'notes' => $this->notes,
            'status' => $this->status,
            'package' => $this->package
                ? [
                    'id' => $this->package->id,
                    'package_name' => $this->package->package_name,
                    'price' => $this->package->price,
                ]
                : null,
        ];
    }
}