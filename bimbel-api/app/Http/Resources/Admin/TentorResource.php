<?php

namespace App\Http\Resources\Admin;

use App\Models\Admin\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TentorResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'specialization' => $this->specialization,
            'education' => $this->education,
            'joining_date' => optional($this->created_at)->format('Y-m-d'),
            'nik' => $this->nik,
            'gender' => $this->gender,
            'birth_date' => optional($this->birth_date)->format('Y-m-d'),
            'address' => $this->address,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
            'is_active' => $this->is_active,

            'user' => [
                'id' => $this->user?->id,
                'name' => $this->user?->name,
                'email' => $this->user?->email,
                'phone' => $this->user?->phone,
                'is_active' => $this->user?->is_active,
            ],

            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'subjects' => SubjectResource::collection($this->whenLoaded('subjects')),
        ];
    }
}