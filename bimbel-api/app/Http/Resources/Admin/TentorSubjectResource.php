<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TentorSubjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'tentor' => [
                'id' => $this->tentor?->id,
                'name' => $this->tentor?->user?->name,
                'email' => $this->tentor?->user?->email,
                'specialization' => $this->tentor?->specialization,
            ],

            'subject' => [
                'id' => $this->subject?->id,
                'code' => $this->subject?->code,
                'name' => $this->subject?->name,
                'education_level' => $this->subject?->education_level,
            ],
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}