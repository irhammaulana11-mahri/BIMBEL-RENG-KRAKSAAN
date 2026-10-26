<?php

namespace App\Http\Resources\Tentor;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Carbon\Carbon;
use App\Services\Academic\AttendanceService;


class TentorScheduleResource extends JsonResource {
    public function toArray(Request $request): array {
        $classType = strtoupper($this->schedule->classroom->class_type ?? 'REGULER');
        
        // Format Tanggal
        $formattedDate = Carbon::parse($this->session_date)->translatedFormat('l, d F Y');

        // Mapping Lokasi
        $locationLabel = $classType === 'ONLINE' 
            ? 'Online' 
            : ($this->room_name ?? $this->location->location_name ?? 'Tempat Bimbel');

        return [
            // 🟢 ATRIBUT DASAR (Selalu Muncul)
            'id'             => $this->id,
            'session_date'   => $this->session_date,
            'formatted_date' => $formattedDate,
            'start_time'     => substr($this->start_time, 0, 5),
            'end_time'       => substr($this->end_time, 0, 5),
            'subject_name'   => $this->subject->name ?? '-',
            'class_name'     => $this->schedule->classroom->name ?? '-',
            'meeting_no'     => $this->meeting_no ?? 1,
            'class_type'     => $classType,
            'location'       => $locationLabel,
            'meeting_url'    => $this->meeting_url,
            'status'         => strtoupper($this->status),
            
            // Total siswa (Aman dipanggil tanpa meload seluruh relasi jika dikelola dengan baik)
            'total_students' => $this->schedule->classroom ? $this->schedule->classroom->students()->count() : 0,

            // 🟢 ATRIBUT WORKSPACE (Hanya muncul jika di-load dari Service)
            
            // 1. Relasi Aktivitas (Materi, Diskusi, Quiz)
            'activities' => $this->whenLoaded('activities', function() {
                return $this->activities->map(function($act) {
                    $reference = $act->relationLoaded('activityable') ? $act->activityable : null;
                    return [
                        'id'              => $act->id,
                        'type'            => $act->activity_type,
                        'title'           => $act->title,
                        'description'     => $act->description,
                        'status'          => $act->status,
                        'display_order'   => $act->display_order,
                        'start_time'      => $act->start_time ? substr($act->start_time, 0, 5) : null,
                        'end_time'        => $act->end_time ? substr($act->end_time, 0, 5) : null,
                        'activityable_id' => $act->activityable_id,
                        'reference_title' => $reference->title ?? null,
                        'started_at'      => $act->started_at,
                        'completed_at'    => $act->completed_at,
                    ];
                })->values();
            }),

            // 2. Relasi Siswa & Absensi (Khusus Workspace) - peserta diambil dari kelas
            'students' => $this->when(
                $this->relationLoaded('schedule')
                    && $this->schedule->relationLoaded('classroom')
                    && $this->schedule->classroom?->relationLoaded('students')
                    && $this->relationLoaded('studentAttendances'),
                fn() => app(AttendanceService::class)->mapStudentsWithAttendance($this->resource)
            ),

            // 3. Absensi Tentor pada sesi ini
            'tentor_attendance' => $this->whenLoaded('tentorAttendance', function() {
                $log = $this->tentorAttendance;
                if (!$log) return null;

                $formatTime = fn($value) => $value
                    ? $value->copy()->setTimezone(AttendanceService::TIMEZONE)->format('H:i')
                    : null;

                return [
                    'attendance_status' => $log->attendance_status,
                    'checkin_time'      => $formatTime($log->checked_in_at),
                    'checkout_time'     => $formatTime($log->checked_out_at),
                    'late_minutes'      => (int) $log->late_minutes,
                    'teaching_minutes'  => (int) $log->teaching_minutes,
                ];
            }),
        ];
    }
}