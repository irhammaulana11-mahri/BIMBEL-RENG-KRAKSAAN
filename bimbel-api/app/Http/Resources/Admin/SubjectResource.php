<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;



class SubjectResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'education_level_id' => $this->education_level_id,
            'education_level' => $this->whenLoaded('educationLevel', fn() => $this->educationLevel),
            // Ambil display_name dari relasi educationLevel
            'education_level_name' => $this->whenLoaded('educationLevel', fn() => $this->educationLevel->display_name),
            'description' => $this->description,
            'is_active' => (bool)$this->is_active,
            
            // Statistik Agregat (Count)
            'curriculums_count' => $this->curriculums_count ?? 0,
            'materials_count'   => $this->materials_count ?? 0,
            'schedules_count'   => $this->schedules_count ?? 0,
            'exams_count'       => $this->exams_count ?? 0,
            'tentors_count'     => $this->tentors_count ?? 0,

            // Relasi Detail
            'curriculums' => $this->whenLoaded('curriculums'),
            'tentors' => TentorResource::collection($this->whenLoaded('tentors')),
            
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
