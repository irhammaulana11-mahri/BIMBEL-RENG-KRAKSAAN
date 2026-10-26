<?php

namespace App\Http\Resources\Academic;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SessionActivityResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'                    => $this->id,
            'schedule_session_id'   => $this->schedule_session_id,
            'activity_type'         => $this->activity_type,
            'title'                 => $this->title,
            'description'           => $this->description,
            'activityable_type'     => $this->activityable_type,
            'activityable_id'       => $this->activityable_id,
            'activityable'          => $this->whenLoaded('activityable',function () {return $this->activityable;}),
            'selection_source'      => $this->selection_source,
            'display_order'         => $this->display_order,
            'status'                => $this->status,
            'start_time'            => $this->start_time,
            'end_time'              => $this->end_time,
            'started_at'            => $this->started_at,
            'completed_at'          => $this->completed_at,
            'note'                  => $this->note,
            'session'               => $this->whenLoaded('session',
                                        function () {
                                            return [
                                                'id'            => $this->session->id,
                                                'session_date'  => $this->session->session_date,
                                                'meeting_no'    => $this->session->meeting_no,
                                                'status'        => $this->session->status,
                                            ];
                                        }
            ),
            'created_by'            => $this->created_by,
            'updated_by'            => $this->updated_by,
            'creator'               => $this->whenLoaded('creator',
                                        function () {
                                            return [
                                                'id'    => $this->creator->id,
                                                'name'  => $this->creator->name ?? $this->creator->full_name ?? '-',
                                            ];
                                        }
            ),

            'updater'               => $this->whenLoaded('updater',
                                        function () {
                                            return [
                                                'id' => $this->updater->id,
                                                'name' => $this->updater->name ?? $this->updater->full_name ?? '-',
                                            ];
                                        }
            ),

            'created_at'            => $this->created_at,
            'updated_at'            => $this->updated_at,
        ];
    }
}