<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'is_active' => $this->is_active,
            'role' => $this->role
                ? [
                    'id' => $this->role->id,
                    'role_name' => $this->role->role_name,
                ]
                : null,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,

        ];
    }
}