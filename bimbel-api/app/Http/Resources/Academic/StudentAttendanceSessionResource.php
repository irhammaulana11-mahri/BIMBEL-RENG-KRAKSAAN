<?php

namespace App\Http\Resources\Academic;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentAttendanceSessionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     * Gunakan bersama AttendanceService::withAttendanceSummary() agar hitungan tidak N+1.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array {
        $classroom = $this->schedule->classroom ?? null;

        // Absensi dianggap sudah diisi jika ada record di table student_attendances
        $isCompleted = ($this->student_attendances_count ?? 0) > 0;

        return [
            'id'                => $this->id,
            'session_date'      => $this->session_date,
            'start_time'        => substr($this->start_time, 0, 5),
            'end_time'          => substr($this->end_time, 0, 5),
            'session_status'    => $this->status,
            'class_name'        => $classroom->name ?? '-',
            'subject_name'      => $this->subject->name ?? '-',
            'tentor_name'       => $this->tentor->user->name ?? $this->tentor->name ?? '-',
            'total_students'    => (int) ($classroom->students_count ?? 0),
            'attended_students' => (int) ($this->present_count ?? 0),
            'attendance_status' => $isCompleted ? 'SELESAI' : 'BELUM',
        ];
    }
}
