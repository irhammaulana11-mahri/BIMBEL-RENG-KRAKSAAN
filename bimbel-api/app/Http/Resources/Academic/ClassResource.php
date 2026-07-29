<?php

namespace App\Http\Resources\Academic;

use App\Http\Resources\Admin\StudentResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'education_level' => $this->education_level,
            'class_type' => $this->class_type,
            'max_students' => $this->max_students,
            'description' => $this->description,
            'is_active' => $this->is_active,
            'students' => StudentResource::collection(
                    $this->whenLoaded('students')
                ),
            'student_count' => $this->whenCounted('students'),
            'schedule_count' => $this->whenCounted('schedules'),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}