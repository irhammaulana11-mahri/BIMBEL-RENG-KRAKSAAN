<?php
namespace App\Services\Admin;

use App\Services\Academic\AttendanceLocationService;
use App\Models\Academic\ClassRoom;
use App\Models\Academic\ProgressReport;
use App\Models\Academic\RescheduleRequest;
use App\Models\Academic\LocationChangeRequest;
use App\Models\Academic\ScheduleSession;
use App\Models\Admin\Student;
use App\Models\Admin\StudentRegistrationRequest;
use App\Models\Admin\Tentor;
use App\Models\Exam\ExamResult;
use App\Models\Finance\Payment;
use App\Models\Finance\Payroll;
use App\Models\Website\Lead;
use App\Services\Academic\ProgressReportService;
use App\Services\Finance\CashflowService;
use App\Support\LocalTime;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Ringkasan operasional bimbel untuk Admin (tanggal menurut WIB).
 */
class AdminDashboardService {

    public function __construct(protected CashflowService $cashflow) {}

    public function summary(): array {
        $now = Carbon::now(LocalTime::TIMEZONE);
        $today = $now->toDateString();
        $monthStart = $now->copy()->startOfMonth()->toDateString();
        $monthEnd = $now->copy()->endOfMonth()->toDateString();
        $previous = $now->copy()->subMonthNoOverflow();

        $cash = $this->cashflow->summary($now->year, $now->month);

        $monthSessions = ScheduleSession::whereBetween('session_date', [$monthStart, $monthEnd])->where('status', '!=', 'CANCELLED');

        $todaySessions = ScheduleSession::with(['schedule.classroom', 'subject', 'tentor.user', 'tentorAttendance'])
            ->whereDate('session_date', $today)
            ->where('status', '!=', 'CANCELLED')
            ->orderBy('start_time')
            ->get()
            ->map(fn($s) => [
                'id'           => $s->id,
                'start_time'   => substr($s->start_time, 0, 5),
                'end_time'     => substr($s->end_time, 0, 5),
                'class_name'   => $s->schedule?->classroom?->name,
                'subject_name' => $s->subject?->name,
                'tentor_name'  => $s->tentor?->user?->name,
                'status'       => $s->status,
                'checked_in'   => (bool) $s->tentorAttendance?->checked_in_at,
                'checkin_time' => LocalTime::format($s->tentorAttendance?->checked_in_at, 'H:i'),
                'remarks'      => AttendanceLocationService::remarks($s->tentorAttendance),
            ]);

        // Rapor bulan lalu: siswa aktif di kelas yang rapornya belum terbit
        $enrolled = DB::table('academic.class_students')->count();
        $publishedLastMonth = ProgressReport::where('period_year', $previous->year)->where('period_month', $previous->month)->where('status', 'PUBLISHED')->count();

        $payroll = Payroll::where('period_year', $previous->year)->where('period_month', $previous->month)->first();

        return [
            'period' => ProgressReportService::periodLabel($now->year, $now->month),
            'stats'  => [
                'active_students' => Student::where('is_active', true)->count(),
                'enrolled_students' => DB::table('academic.class_students')->distinct()->count('student_id'),
                'active_tentors'  => Tentor::where('is_active', true)->count(),
                'active_classes'  => ClassRoom::where('is_active', true)->count(),
                'sessions_month'  => (clone $monthSessions)->count(),
                'sessions_done'   => (clone $monthSessions)->where('status', 'COMPLETED')->count(),
            ],
            'finance' => [
                'income'               => $cash['income'],
                'payroll'              => $cash['payroll'],
                'expenses'             => $cash['expenses'],
                'net'                  => $cash['net'],
                'receivables'          => $cash['receivables'],
                'trend'                => $cash['trend'],
            ],
            // Pekerjaan yang menunggu tindakan Admin
            'inbox' => [
                ['key' => 'payments',      'label' => 'Bukti bayar menunggu verifikasi', 'count' => Payment::where('status', 'PENDING')->count(), 'link' => '/admin/finance'],
                ['key' => 'reschedule',    'label' => 'Pengajuan pindah jadwal', 'count' => RescheduleRequest::where('status', 'PENDING')->count(), 'link' => '/admin/reschedule-requests'],
                ['key' => 'locations',     'label' => 'Pengajuan lokasi les sementara', 'count' => LocationChangeRequest::where('status', 'PENDING')->count(), 'link' => '/admin/location-requests'],
                ['key' => 'registrations', 'label' => 'Pendaftaran anak dari orang tua', 'count' => StudentRegistrationRequest::where('status', 'PENDING')->count(), 'link' => '/admin/enrollments'],
                ['key' => 'leads',         'label' => 'Lead baru belum dihubungi', 'count' => Lead::where('status', 'NEW')->count(), 'link' => '/admin/leads'],
                ['key' => 'essays',        'label' => 'Jawaban ujian menunggu penilaian', 'count' => ExamResult::where('status', 'SUBMITTED')->count(), 'link' => '/admin/exam'],
                ['key' => 'stuck',         'label' => 'Sesi lewat hari belum diakhiri tentor', 'count' => ScheduleSession::where('status', 'IN_PROGRESS')->whereDate('session_date', '<', $today)->count(), 'link' => '/admin/attandances'],
                ['key' => 'overdue',       'label' => 'Tagihan lewat jatuh tempo', 'count' => $cash['receivables']['overdue_count'], 'link' => '/admin/finance'],
            ],
            'month_close' => [
                'previous_period'     => ProgressReportService::periodLabel($previous->year, $previous->month),
                'reports_published'   => $publishedLastMonth,
                'reports_expected'    => $enrolled,
                'payroll_status'      => $payroll?->status,
            ],
            'today_sessions' => $todaySessions->values(),
            'package_distribution' => DB::table('academic.class_students')
                ->join('academic.classes', 'academic.classes.id', '=', 'academic.class_students.class_id')
                ->leftJoin('website.packages', 'website.packages.id', '=', 'academic.classes.package_id')
                ->selectRaw("COALESCE(website.packages.package_name, 'Tanpa paket') as name, COUNT(DISTINCT academic.class_students.student_id) as total")
                ->groupByRaw("COALESCE(website.packages.package_name, 'Tanpa paket')")
                ->orderByDesc('total')
                ->get()
                ->map(fn($r) => ['name' => $r->name, 'total' => (int) $r->total]),
            'recent_leads' => Lead::with('package')->latest()->take(5)->get()->map(fn($l) => [
                'id'              => $l->id,
                'parent_name'     => $l->parent_name,
                'student_name'    => $l->student_name,
                'education_level' => $l->education_level,
                'package_name'    => $l->package?->package_name,
                'status'          => $l->status,
                'created_at'      => LocalTime::format($l->created_at, 'Y-m-d H:i'),
            ]),
        ];
    }
}
