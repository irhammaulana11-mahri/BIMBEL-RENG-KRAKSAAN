<?php
namespace App\Services\Tentor;

use App\Http\Controllers\Api\TentorPortal\TentorExamResultController;
use App\Models\Academic\ClassStudent;
use App\Models\Academic\RescheduleRequest;
use App\Models\Academic\ScheduleSession;
use App\Models\Academic\StudentAttendance;
use App\Models\Admin\Tentor;
use App\Models\Exam\ExamResult;
use App\Services\Academic\ProgressReportService;
use App\Support\LocalTime;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

/**
 * Dashboard tentor (semua tanggal & jam menurut WIB).
 */
class TentorDashboardService {

    // Rentang hari ke belakang untuk pengingat absensi yang belum lengkap
    public const ATTENDANCE_LOOKBACK_DAYS = 14;

    public function __construct(protected ProgressReportService $reportService) {}

    public function getDashboardData() {
        $user = Auth::user();
        $tentor = Tentor::where('user_id', $user->id)->first();
        $firstName = explode(' ', trim($user->name))[0];

        if (!$tentor) {
            return [
                'tentor_name'       => $firstName,
                'summary'           => ['total' => 0, 'completed' => 0, 'upcoming' => 0, 'in_progress' => 0, 'week_total' => 0],
                'next_session'      => null,
                'today_schedules'   => [],
                'needs_attention'   => [],
                'recent_activities' => [],
            ];
        }

        $now = Carbon::now(LocalTime::TIMEZONE);
        $today = $now->toDateString();
        $currentTime = $now->format('H:i:s');

        $todaySessions = ScheduleSession::with(['subject', 'schedule.classroom' => fn($q) => $q->withCount('students'), 'activities'])
            ->withCount('studentAttendances')
            ->where('tentor_id', $tentor->id)
            ->whereDate('session_date', $today)
            ->orderBy('start_time')
            ->get();

        $summary = [
            'total'       => $todaySessions->where('status', '!=', 'CANCELLED')->count(),
            'completed'   => $todaySessions->where('status', 'COMPLETED')->count(),
            'in_progress' => $todaySessions->where('status', 'IN_PROGRESS')->count(),
            'upcoming'    => $todaySessions->whereIn('status', ['SCHEDULED', 'RESCHEDULED'])->count(),
            'week_total'  => ScheduleSession::where('tentor_id', $tentor->id)
                ->whereBetween('session_date', [$now->copy()->startOfWeek()->toDateString(), $now->copy()->endOfWeek()->toDateString()])
                ->where('status', '!=', 'CANCELLED')
                ->count(),
        ];

        // Sesi berjalan diprioritaskan, lalu sesi terdekat yang belum lewat
        $next = $todaySessions->firstWhere('status', 'IN_PROGRESS')
            ?? $todaySessions->whereIn('status', ['SCHEDULED', 'RESCHEDULED'])->first(fn($s) => $s->end_time >= $currentTime || $s->end_time < $s->start_time); // termasuk sesi lewat tengah malam

        $nextSession = $next ? [
            'id'           => $next->id,
            'subject_name' => $next->subject?->name ?? '-',
            'class_name'   => $next->schedule?->classroom?->name,
            'start_time'   => substr($next->start_time, 0, 5),
            'end_time'     => substr($next->end_time, 0, 5),
            'status'       => $next->status,
        ] : null;

        $todaySchedules = $todaySessions->map(fn($s) => [
            'id'                => $s->id,
            'time'              => substr($s->start_time, 0, 5),
            'end_time'          => substr($s->end_time, 0, 5),
            'subject_name'      => $s->subject?->name ?? '-',
            'class_name'        => $s->schedule?->classroom?->name,
            'status'            => $s->status,
            'students_count'    => $s->schedule?->classroom?->students_count ?? 0,
            'attendance_filled' => $s->student_attendances_count,
            'activities_count'  => $s->activities->count(),
        ])->values();

        return [
            'tentor_name'       => $firstName,
            'summary'           => $summary,
            'next_session'      => $nextSession,
            'today_schedules'   => $todaySchedules,
            'needs_attention'   => $this->needsAttention($tentor, $now, $todaySessions),
            'recent_activities' => $this->recentActivities($tentor),
        ];
    }

    private function needsAttention(Tentor $tentor, Carbon $now, $todaySessions): array {
        $alerts = [];
        $today = $now->toDateString();

        // 1. Sesi hari sebelumnya yang belum diakhiri
        ScheduleSession::with('subject', 'schedule.classroom')
            ->where('tentor_id', $tentor->id)
            ->where('status', 'IN_PROGRESS')
            ->whereDate('session_date', '<', $today)
            ->orderBy('session_date')
            ->get()
            ->each(function ($s) use (&$alerts) {
                $alerts[] = ['session_id' => $s->id, 'type' => 'Sesi', 'link' => "/tentor/sessions/{$s->id}/workspace",
                    'message' => "Sesi {$s->subject?->name} ({$s->schedule?->classroom?->name}) {$s->session_date} belum diakhiri."];
            });

        // 2. Absensi siswa belum lengkap pada sesi yang sudah berlangsung
        $recent = ScheduleSession::with(['subject', 'schedule.classroom'])
            ->withCount('studentAttendances')
            ->where('tentor_id', $tentor->id)
            ->whereIn('status', ProgressReportService::HELD_SESSION_STATUSES)
            ->whereBetween('session_date', [$now->copy()->subDays(self::ATTENDANCE_LOOKBACK_DAYS)->toDateString(), $today])
            ->get();
        $classSizes = ClassStudent::whereIn('class_id', $recent->pluck('schedule.class_id')->unique())
            ->selectRaw('class_id, COUNT(*) as total')->groupBy('class_id')->pluck('total', 'class_id');
        foreach ($recent as $s) {
            $missing = ($classSizes[$s->schedule?->class_id] ?? 0) - $s->student_attendances_count;
            if ($missing > 0) {
                $alerts[] = ['session_id' => $s->id, 'type' => 'Absensi', 'link' => "/tentor/sessions/{$s->id}/workspace",
                    'message' => "Absensi {$s->subject?->name} ({$s->schedule?->classroom?->name}) {$s->session_date}: {$missing} siswa belum dicatat."];
            }
        }

        // 3. Sesi hari ini yang belum punya aktivitas
        foreach ($todaySessions as $s) {
            if (in_array($s->status, ['SCHEDULED', 'RESCHEDULED'], true) && $s->activities->isEmpty()) {
                $alerts[] = ['session_id' => $s->id, 'type' => 'Materi', 'link' => '/tentor/schedules',
                    'message' => "Sesi {$s->subject?->name} jam " . substr($s->start_time, 0, 5) . ' belum memiliki aktivitas/materi.'];
            }
        }

        // 4. Essay menunggu dinilai
        $pendingEssays = TentorExamResultController::ownedQuery($tentor->id)->where('status', 'SUBMITTED')->count();
        if ($pendingEssays > 0) {
            $alerts[] = ['session_id' => null, 'type' => 'Penilaian', 'link' => '/tentor/evaluations',
                'message' => "{$pendingEssays} jawaban ujian menunggu penilaian essay."];
        }

        // 5. Catatan rapor bulan ini yang belum diisi (rapor belum terbit)
        $groups = $this->reportService->notesForTentor($tentor, $now->year, $now->month);
        $missingNotes = collect($groups)->sum(fn($g) => collect($g['students'])->filter(fn($s) => !$s['locked'] && !$s['note'] && $s['held_sessions'] > 0)->count());
        if ($missingNotes > 0) {
            $alerts[] = ['session_id' => null, 'type' => 'Rapor', 'link' => '/tentor/progress',
                'message' => "{$missingNotes} catatan perkembangan siswa bulan " . ProgressReportService::periodLabel($now->year, $now->month) . ' belum diisi.'];
        }

        return $alerts;
    }

    // Gabungan kejadian terbaru: sesi selesai, penilaian, keputusan pengajuan reschedule
    private function recentActivities(Tentor $tentor): array {
        $events = collect();

        ScheduleSession::with('subject', 'schedule.classroom', 'tentorAttendance')
            ->where('tentor_id', $tentor->id)
            ->where('status', 'COMPLETED')
            ->orderByDesc('session_date')->orderByDesc('end_time')
            ->limit(5)
            ->get()
            ->each(fn($s) => $events->push([
                'icon'    => 'session',
                'at'      => $s->tentorAttendance?->checked_out_at ?? Carbon::parse("{$s->session_date} {$s->end_time}", LocalTime::TIMEZONE),
                'message' => "Mengakhiri sesi {$s->subject?->name} di {$s->schedule?->classroom?->name}",
            ]));

        ExamResult::with('exam', 'student')
            ->where('graded_by', $tentor->user_id)
            ->whereNotNull('graded_at')
            ->orderByDesc('graded_at')
            ->limit(5)
            ->get()
            ->each(fn($r) => $events->push([
                'icon'    => 'grade',
                'at'      => $r->graded_at,
                'message' => "Menilai {$r->exam?->title} milik {$r->student?->full_name}",
            ]));

        RescheduleRequest::with('session.subject')
            ->where('requested_by', $tentor->user_id)
            ->whereIn('status', ['APPROVED', 'REJECTED'])
            ->orderByDesc('reviewed_at')
            ->limit(5)
            ->get()
            ->each(fn($r) => $events->push([
                'icon'    => $r->status === 'APPROVED' ? 'approved' : 'rejected',
                'at'      => $r->reviewed_at,
                'message' => "Pengajuan reschedule {$r->session?->subject?->name} " . ($r->status === 'APPROVED' ? 'disetujui' : 'ditolak') . ' Admin',
            ]));

        return $events
            ->filter(fn($e) => $e['at'])
            ->sortByDesc(fn($e) => Carbon::parse($e['at'])->timestamp)
            ->take(8)
            ->map(fn($e) => [
                'icon'    => $e['icon'],
                'message' => $e['message'],
                'at'      => LocalTime::format(Carbon::parse($e['at']), 'Y-m-d H:i'),
            ])
            ->values()
            ->all();
    }
}
