<?php

namespace App\Http\Resources\Academic;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LearningLocationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'=>$this->id,
            'location_name'=>$this->location_name,
            'code'=>$this->code,
            'address'=>$this->address,
            'latitude'=>$this->latitude,
            'longitude'=>$this->longitude,
            'radius_meter'=>$this->radius_meter,
            'description'=>$this->description,
            'meeting_url'=>$this->meeting_url,
            'contact_person'=>$this->contact_person,
            'is_active'=>$this->is_active,
            // 'schedule_count'=>$this->whenCounted('schedules'),
            'created_at'=>$this->created_at,
            'updated_at'=>$this->updated_at,
        ];
    }
}