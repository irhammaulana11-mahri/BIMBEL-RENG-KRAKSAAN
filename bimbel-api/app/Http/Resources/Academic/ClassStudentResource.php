<?php

namespace App\Http\Resources\Academic;

use App\Http\Resources\Admin\StudentResource;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassStudentResource extends JsonResource
{
    public function toArray(Request $request): array {
        return [
            'id' => $this->id,
            'student' => [
                'id' => $this->student?->id,
                'nis' => $this->student?->nis,
                'name' => $this->student?->full_name,
                'education_level' => $this->student?->education_level,
                'school_name' => $this->student?->school_name,
            ],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
