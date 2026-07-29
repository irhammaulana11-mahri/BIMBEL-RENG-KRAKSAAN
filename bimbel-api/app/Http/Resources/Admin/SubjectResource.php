<?php

namespace App\Http\Resources\Admin;

use Illuminate\Http\Request;
use App\Models\Admin\User;
use App\Models\Admin\Tentor;
use Illuminate\Http\Resources\Json\JsonResource;

class SubjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code,
            'name' => $this->name,
            'education_level' => $this->education_level,
            'description' => $this->description,
            'is_active' => (bool)$this->is_active,
            'total_tentors' => $this->whenLoaded(
                'tentors',
                fn() => $this->tentors->count()
            ),

            'tentors' => TentorResource::collection(
                $this->whenLoaded('tentors')
            ),
            // 'materials_count'=>$this->materials()->count(),
            // 'curriculum_count'=>$this->curriculum()->count(),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}