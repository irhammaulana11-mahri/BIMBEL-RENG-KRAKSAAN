<?php

namespace App\Http\Resources\Academic;

use App\Services\Academic\AttendanceService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TentorAttendanceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     * Gunakan bersama AttendanceService::withAttendanceSummary() agar hitungan tidak N+1.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array {
        $log = $this->tentorAttendance; // Relasi ke model TentorAttendance
        $classroom = $this->schedule->classroom ?? null;
        $classType = strtoupper($classroom->class_type ?? 'REGULER');

        // Mapping tipe kelas ke ikon/lokasi frontend (online, rumah, bimbel)
        $locationType = 'bimbel';
        if ($classType === 'ONLINE') $locationType = 'online';
        if ($classType === 'PRIVATE') $locationType = 'rumah';

        $formatTime = fn($value) => $value
            ? $value->copy()->setTimezone(AttendanceService::TIMEZONE)->format('H:i')
            : null;

        return [
            'id'                => $this->id,
            'session_id'        => $this->id,
            'session_date'      => $this->session_date,
            'start_time'        => substr($this->start_time, 0, 5),
            'end_time'          => substr($this->end_time, 0, 5),
            'session_status'    => $this->status,
            'subject_name'      => $this->subject->name ?? '-',
            'class_name'        => $classroom->name ?? '-',
            'location_type'     => $locationType,
            'tentor_name'       => $this->tentor->user->name ?? $this->tentor->name ?? '-',

            // Data Absensi Tentor (Jika belum absen, nilai null/default)
            'attendance_status'    => $log ? $log->attendance_status : 'BELUM ABSEN',
            'checkin_time'         => $log ? $formatTime($log->checked_in_at) : null,
            'checkout_time'        => $log ? $formatTime($log->checked_out_at) : null,
            'late_minutes'         => $log ? (int) $log->late_minutes : 0,
            'teaching_minutes'     => $log ? (int) $log->teaching_minutes : 0,
            'is_payroll_processed' => $log ? (bool) $log->is_payroll_processed : false,
            'note'                 => $log ? $log->note : null,

            // Ringkasan Murid (Untuk Card Ringkasan Sesi)
            'total_students'    => (int) ($classroom->students_count ?? 0),
            'present_count'     => (int) ($this->present_count ?? 0),
            'is_filled'         => $log !== null || ($this->student_attendances_count ?? 0) > 0,
        ];
    }
}
