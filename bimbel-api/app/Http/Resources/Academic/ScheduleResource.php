<?php

namespace App\Http\Resources\Academic;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ScheduleResource extends JsonResource {
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'=>$this->id,
            'class_id'          => $this->class_id,

            'classroom'=>[
                'id'            =>$this->classroom?->id,
                'class_code'    =>$this->classroom?->code,
                'class_name'    =>$this->classroom?->name,
                'class_type'    =>$this->classroom?->class_type,
            ],

            'subject'=>[
                'id'            =>$this->subject?->id,
                'subject_name'  =>$this->subject?->name,
            ],

            'tentor'=>[
                'id'            =>$this->tentor?->id,
                'tentor_name'   =>$this->tentor?->user?->name,
            ],

            'location'          =>$this->location ? [
                'id'            =>$this->location->id,
                'location_name' =>$this->location->location_name,
            ] : null,

            'room_name'         =>$this->room_name,
            'meeting_url'       =>$this->meeting_url,
            'day_of_week'       =>$this->day_of_week,
            'start_time'        =>$this->start_time,
            'end_time'          =>$this->end_time,
            'status'            => $this->status,
            'is_active'         =>$this->is_active,
            'created_at'        =>$this->created_at,
            'updated_at'        =>$this->updated_at,
            'sessions'          => ScheduleSessionResource::collection($this->whenLoaded('sessions')),
            'total_sessions'    => $this->whenLoaded('sessions', function() {
                                    return $this->sessions->count();}),
        ];
    }
}
