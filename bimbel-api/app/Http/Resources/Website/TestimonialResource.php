<?php

namespace App\Http\Resources\Website;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TestimonialResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id' => $this->id,
            'student_name' => $this->student_name,
            'school_name' => $this->school_name,
            'testimonial' => $this->testimonial,
            'photo_url' => $this->photo_url,
            'rating' => $this->rating,
            'is_active' => $this->is_active,
        ];
    }
}