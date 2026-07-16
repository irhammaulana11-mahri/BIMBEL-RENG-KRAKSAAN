<?php

namespace App\Http\Resources\Website;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LeadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,

            'parent_name' => $this->parent_name,
            'phone' => $this->phone,
            'student_name' => $this->student_name,
            'education_level' => $this->education_level,

            'notes' => $this->notes,
            'status' => $this->status,

            'user_id' => $this->user_id,

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

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