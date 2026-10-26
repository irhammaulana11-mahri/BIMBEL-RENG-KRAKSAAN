<?php

namespace App\Http\Resources\Academic;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ScheduleSessionResource extends JsonResource {
    public function toArray(Request $request): array {
        $classType = $this->schedule?->classroom?->class_type ?? 'REGULER';
        
        return [
            'id'            => $this->id,
            'schedule_id'   => $this->schedule_id,
            'meeting_no'    => $this->meeting_no,
            'session_date'  => $this->session_date,
            'day_of_week'   => $this->day_of_week,
            'start_time'    => substr($this->start_time, 0, 5),
            'end_time'      => substr($this->end_time, 0, 5),
            
            // Relasi Rata (Flattened)
            'class_name'    => $this->schedule?->classroom?->name ?? '-',
            'class_type'    => strtoupper($classType),
            'subject_name'  => $this->subject?->name ?? '-',
            'tentor_name'   => $this->tentor?->user?->name ?? $this->tentor?->name ?? 'Belum Diplot',
            
            // Lokasi
            'location_name' => $this->location?->location_name ?? '-',
            'room_name'     => $this->room_name,
            'meeting_url'   => $this->meeting_url,
            
            // Status Operasional
            'status'        => strtoupper($this->status ?? 'SCHEDULED'),
            'reason'        => $this->reason,
            'note'          => $this->note,
            
            // Dummy Attendance (Disiapkan untuk relasi attendance nanti)
            'attendance_count' => 0,
            'total_students'   => $this->schedule?->classroom?->students_count ?? 0,
        ];
    }
}