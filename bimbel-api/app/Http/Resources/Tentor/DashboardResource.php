<?php

namespace App\Http\Resources\Tentor;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DashboardResource extends JsonResource {
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array {
        return [
            'tentor_name'       => $this['tentor_name'],
            'summary'           => $this['summary'],
            'next_session'      => $this['next_session'],
            'today_schedules'   => $this['today_schedules'],
            'needs_attention'   => $this['needs_attention'],
            'recent_activities' => $this['recent_activities']
        ];
    }
}
