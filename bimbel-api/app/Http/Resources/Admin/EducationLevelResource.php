<?php

namespace App\Http\Resources\Admin;

use App\Models\Admin\Subject;
use App\Models\Academic\ClassRoom;
use App\Models\Website\Package;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EducationLevelResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'level_code'      => $this->level_code,
            'education_level' => $this->education_level,
            'grade_level'     => $this->grade_level,
            'display_name'    => $this->display_name,
            'sort_order'      => $this->sort_order,
            'is_active'       => $this->is_active,
            'description'     => $this->description,
            
            // Mengirimkan total data relasi untuk keperluan validasi Nonaktif di Frontend
            'usage_count'     => [
                'subjects' => $this->subjects_count ?? 0,
                'classes'  => $this->classes_count ?? 0,
                'packages' => $this->packages_count ?? 0, // Buka jika package sudah ada
            ]
        ];
    }
}