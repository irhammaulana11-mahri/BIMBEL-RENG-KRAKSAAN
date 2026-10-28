<?php

namespace App\Http\Resources\Admin;

use App\Models\Admin\User;
use App\Models\Admin\Student;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ParentResource extends JsonResource
{
    public function toArray(Request $request): array {
        return [
            'id' => $this->id,

            'full_name' => $this->full_name,
            'occupation' => $this->occupation,
            'relationship' => $this->relationship,
            'address' => $this->address,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,

            'user' => [
                'id' => $this->user?->id,
                'name' => $this->user?->name,
                'email' => $this->user?->email,
                'phone' => $this->user?->phone,
                'is_active' => $this->user?->is_active,
            ],

            // 'students' => $this->students->map(function ($student) {
            //     return [
            //         'id' => $student->id,
            //         'name' => $student->user?->name,
            //         'nis' => $student->nis,
            //         'grade' => $student->grade,
            //         'school_name' => $student->school_name,
            //     ];
            // }),

            // 'students_count' => $this->students_count ?? $this->students->count(),
            'students_count' => $this->whenCounted('students'),
            'students' => StudentResource::collection($this->whenLoaded('students')),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}