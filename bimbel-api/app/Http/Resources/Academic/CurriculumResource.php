<?php

namespace App\Http\Resources\Academic;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CurriculumResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'                 => $this->id,
            'subject_id'         => $this->subject_id,
            'subject_name'       => $this->whenLoaded('subject', fn() => $this->subject->name),
            'title'              => $this->title,
            'description'        => $this->description,
            'education_level_id' => $this->education_level_id,
            'semester'           => $this->semester,
            'order_no'           => $this->order_no,
            'is_active'          => $this->is_active,
            'materials_count'    => $this->materials_count ?? 0,
            
            // Nested relations if loaded
            'materials'          => MaterialResource::collection($this->whenLoaded('materials')),
            
            'created_at'         => $this->created_at,
            'updated_at'         => $this->updated_at,
        ];
    }
}