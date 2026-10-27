<?php

namespace App\Http\Resources\Academic;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MaterialResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'curriculum_id'    => $this->curriculum_id,
            'curriculum_title' => $this->whenLoaded('curriculum', fn() => $this->curriculum->title),
            'subject_id'       => $this->whenLoaded('curriculum', fn() => $this->curriculum->subject_id),
            'subject_name'     => $this->whenLoaded('curriculum', fn() => $this->curriculum->subject?->name),
            'education_level'  => $this->whenLoaded('curriculum', fn() => $this->curriculum->subject?->educationLevel?->display_name),
            'usage_count'      => $this->when(isset($this->usage_count), fn() => (int) $this->usage_count),
            'tentor_id'        => $this->tentor_id,
            'tentor_name'      => $this->whenLoaded('tentor', fn() => $this->tentor->user->name ?? 'Tentor'),
            'title'            => $this->title,
            'description'      => $this->description,
            'material_type'    => $this->material_type,
            'file_path'        => $this->file_path,
            'video_url'        => $this->video_url,
            'external_url'     => $this->external_url,
            'duration_minutes' => $this->duration_minutes,
            'sort_order'       => $this->sort_order,
            'is_active'        => $this->is_active,
            'created_at'       => $this->created_at,
            'updated_at'       => $this->updated_at,
        ];
    }
}