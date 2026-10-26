<?php
namespace App\Services\Tentor;

use App\Models\Academic\ScheduleSession;
use App\Models\Admin\Tentor;
use App\Models\Admin\User;
use Illuminate\Support\Facades\Auth;

class TentorDashboardService {
    public function getDashboardData() {
        $user = Auth::user();

        // 🟢 AMBIL DATA TENTOR DENGAN AMAN
        // Mengatasi potensi error jika relasi belum ter-load atau mengembalikan string/null
        $tentor = Tentor::where('user_id', $user->id)->first();
        
        if (!$tentor) {
            // Fallback jika akun yang login bukan tentor / data tentor belum di-link
            return [
                'tentor_name'       => explode(' ', trim($user->name))[0],
                'summary'           => ['total' => 0, 'completed' => 0, 'upcoming' => 0],
                'next_session'      => null,
                'today_schedules'   => [],
                'needs_attention'   => [],
                'recent_activities' => []
            ];
        }

        $today = now()->format('Y-m-d');
        $currentTime = now()->format('H:i:s');

        // Menggunakan tentor_id yang valid ($tentor->id)
        $todaySessions = ScheduleSession::with(['subject', 'schedule.classroom', 'studentAttendances', 'activities'])
            ->where('tentor_id', $tentor->id)
            ->whereDate('session_date', $today)
            ->orderBy('start_time', 'asc')
            ->get();

        // 1. Hitung Summary
        $summary = [
            'total'     => $todaySessions->count(),
            'completed' => $todaySessions->where('status', 'COMPLETED')->count(),
            'upcoming'  => $todaySessions->whereIn('status', ['SCHEDULED', 'PREPARING', 'READY'])->count(),
        ];

        // 2. Cari Next Session
        $next = $todaySessions->where('start_time', '>=', $currentTime)->where('status', '!=', 'COMPLETED')->first();
        if (!$next) {
            $next = $todaySessions->where('status', 'IN_PROGRESS')->first();
        }

        $nextSession = $next ? [
            'id'           => $next->id,
            'subject_name' => $next->subject->name ?? '-',
            'start_time'   => substr($next->start_time, 0, 5),
            'status'       => $next->status
        ] : null;

        // 3. List Jadwal Hari Ini
        $todaySchedules = $todaySessions->map(function($session) {
            return [
                'id'           => $session->id,
                'time'         => substr($session->start_time, 0, 5),
                'subject_name' => $session->subject->name ?? '-'
            ];
        })->values();

        // 4. Perlu Perhatian (Alerts)
        $needsAttention = [];
        foreach ($todaySessions as $session) {
            if ($session->status === 'COMPLETED' && $session->studentAttendances->isEmpty()) {
                $needsAttention[] = ['session_id' => $session->id, 'type' => 'Absensi', 'message' => "Absensi {$session->subject->name} kosong"];
            }
            if (in_array($session->status, ['SCHEDULED', 'PREPARING']) && $session->activities->isEmpty()) {
                $needsAttention[] = ['session_id' => $session->id, 'type' => 'Materi', 'message' => "Materi {$session->subject->name} belum diisi"];
            }
        }

        // 5. Aktivitas Terakhir
        $recentActivities = [
            ['icon' => 'check', 'message' => 'Sistem siap digunakan.'],
        ];

        return [
            'tentor_name'       => explode(' ', trim($user->name))[0],
            'summary'           => $summary,
            'next_session'      => $nextSession,
            'today_schedules'   => $todaySchedules,
            'needs_attention'   => $needsAttention,
            'recent_activities' => $recentActivities
        ];
    }
}