<?php

namespace App\Http\Resources\Website;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'description' => $this->description,
            'activity_date' => $this->activity_date,
            'location' => $this->location,
            'cover_image' => $this->cover_image,
            'is_active' => $this->is_active,
            'images' => ActivityImageResource::collection(
                $this->whenLoaded('images')
            ),
        ];
    }
}