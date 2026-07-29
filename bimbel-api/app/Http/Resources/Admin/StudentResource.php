<?php

namespace App\Http\Resources\Admin;

use App\Models\Admin\ParentModel;
use App\Models\Admin\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;


class StudentResource extends JsonResource {
    public function toArray(Request $request): array {
        // $this->parent->user?->email;
        $parent = $this->parents->first();
        $user = $parent->user;
         return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'nis' => $this->nis,
            'gender' => $this->gender,
            'birth_date' => optional($this->birth_date)->format('Y-m-d'),
            'education_level' => $this->education_level,
            'school_name' => $this->school_name,
            'grade' => $this->grade,            
            'is_active' => $this->is_active,
            'photo' => $this->photo,
            'parent' => [
                'id' => $parent?->id,
                'full_name' => $parent?->full_name,
                'occupation' => $parent?->occupation,
                'relationship' => $parent?->relationship,
                'address' => $parent?->address,

                'user' => [
                    'id' => $user?->id,
                    'name' => $user?->name,
                    'email' => $user?->email,
                    'phone' => $user?->phone,
                    'is_active' => $user?->is_active,
                ],
            ],
            
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
