<?php

namespace App\Http\Resources\Website;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ActivityImageResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id' => $this->id,
            'image_url' => $this->image_url
        ];
    }
}