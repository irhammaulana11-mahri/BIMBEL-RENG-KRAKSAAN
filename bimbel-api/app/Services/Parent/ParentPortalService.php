<?php
namespace App\Services\Parent;

use App\Models\Academic\ClassRoom;
use App\Models\Academic\ClassStudent;
use App\Models\Academic\RescheduleRequest;
use App\Models\Academic\ScheduleSession;
use App\Models\Admin\ParentModel;
use App\Models\Admin\Student;
use App\Models\Admin\StudentRegistrationRequest;
use App\Models\Exam\ExamResult;
use App\Models\Finance\Invoice;
use App\Services\Academic\ProgressReportService;
use App\Services\Academic\RescheduleRequestService;
use App\Support\LocalTime;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

/**
 * Data portal orang tua: hanya anak-anak milik orang tua yang login.
 */
class ParentPortalService {

    public function __construct(protected ProgressReportService $reportService) {}

    public function currentParent(): ParentModel {
        $parent = ParentModel::with('user')->where('user_id', Auth::id())->first();
        abort_unless($parent, 403, 'Akun ini tidak terhubung dengan data orang tua.');
        return $parent;
    }

    public function childIds(ParentModel $parent): array {
        return $parent->students()->pluck('master.students.id')->all();
    }

    // Anak beserta kelas & paketnya
    public function children(ParentModel $parent): Collection {
        return $parent->students()
            ->with(['classes.package', 'classes.location'])
            ->orderBy('full_name')
            ->get()
            ->map(fn(Student $s) => [
                'id'              => $s->id,
                'name'            => $s->full_name,
                'nis'             => $s->nis,
                'gender'          => $s->gender,
                'birth_date'      => $s->birth_date,
                'school_name'     => $s->school_name,
                'education_level' => $s->education_level,
                'grade'           => $s->grade,
                'is_active'       => (bool) $s->is_active,
                'has_login'       => $s->user_id !== null,
                'classes'         => $s->classes->map(fn(ClassRoom $c) => [
                    'id'            => $c->id,
                    'name'          => $c->name,
                    'class_type'    => $c->class_type,
                    'package_name'  => $c->package?->package_name,
                    'package_price' => $c->package ? (float) $c->package->default_price : null,
                    'location_name' => $c->location?->location_name,
                ])->values(),
            ]);
    }

    /*
    |--------------------------------------------------------------------------
    | JADWAL
    |--------------------------------------------------------------------------
    */

    /**
     * Sesi kelas anak dalam rentang tanggal (WIB), lengkap dengan absensi tiap anak & pengajuan pindah jadwal.
     */
    public function sessions(ParentModel $parent, string $from, string $to, ?string $studentId = null): Collection {
        $childIds = $this->childIds($parent);
        if ($studentId) $childIds = array_values(array_intersect($childIds, [$studentId]));
        if (empty($childIds)) return collect();

        $membership = ClassStudent::whereIn('student_id', $childIds)->get(['class_id', 'student_id'])->groupBy('class_id');
        if ($membership->isEmpty()) return collect();

        $names = Student::whereIn('id', $childIds)->pluck('full_name', 'id');

        $sessions = ScheduleSession::query()
            ->with([
                'schedule.classroom', 'subject', 'tentor.user', 'location',
                'studentAttendances' => fn($q) => $q->whereIn('student_id', $childIds),
            ])
            ->whereHas('schedule', fn($q) => $q->whereIn('class_id', $membership->keys()))
            ->whereBetween('session_date', [$from, $to])
            ->orderBy('session_date')->orderBy('start_time')
            ->get();

        // Pengajuan pindah jadwal milik orang tua ini (terbaru per sesi)
        $requests = RescheduleRequest::whereIn('session_id', $sessions->pluck('id'))
            ->where('requested_by', Auth::id())
            ->orderByDesc('created_at')
            ->get()
            ->unique('session_id')
            ->keyBy('session_id');

        return $sessions->map(function (ScheduleSession $session) use ($membership, $names, $requests) {
            $attendance = $session->studentAttendances->keyBy('student_id');
            $children = ($membership->get($session->schedule->class_id) ?? collect())
                ->map(fn($m) => [
                    'id'                => $m->student_id,
                    'name'              => $names->get($m->student_id),
                    'attendance_status' => $attendance->get($m->student_id)?->attendance_status,
                ])->values();
            $request = $requests->get($session->id);

            return [
                'id'            => $session->id,
                'session_date'  => $session->session_date,
                'start_time'    => substr($session->start_time, 0, 5),
                'end_time'      => substr($session->end_time, 0, 5),
                'status'        => $session->status,
                'meeting_no'    => $session->meeting_no,
                'class_name'    => $session->schedule->classroom?->name,
                'class_type'    => $session->schedule->classroom?->class_type,
                'subject_name'  => $session->subject?->name,
                'tentor_name'   => $session->tentor?->user?->name,
                'location_name' => $session->location?->location_name,
                'room_name'     => $session->room_name,
                'meeting_url'   => $session->meeting_url,
                'note'          => $session->status === 'RESCHEDULED' ? $session->reason : null,
                'children'      => $children,
                'can_request'   => RescheduleRequestService::isMovable($session) && $request?->status !== 'PENDING',
                'my_request'    => $request ? [
                    'id'                  => $request->id,
                    'status'              => $request->status,
                    'proposed_date'       => $request->proposed_date,
                    'proposed_start_time' => substr($request->proposed_start_time, 0, 5),
                    'review_note'         => $request->review_note,
                ] : null,
            ];
        });
    }

    // Sesi milik kelas salah satu anak (untuk pengajuan pindah jadwal)
    public function findChildSession(ParentModel $parent, string $sessionId, ?string $studentId): ScheduleSession {
        abort_unless(Str::isUuid($sessionId), 404, 'Sesi tidak ditemukan.');
        $childIds = $this->childIds($parent);
        if ($studentId && !in_array($studentId, $childIds, true)) abort(404, 'Sesi tidak ditemukan.');

        $classIds = ClassStudent::whereIn('student_id', $studentId ? [$studentId] : $childIds)->pluck('class_id');
        $session = ScheduleSession::whereHas('schedule', fn($q) => $q->whereIn('class_id', $classIds))
            ->where('id', $sessionId)
            ->first();
        abort_unless($session, 404, 'Sesi tidak ditemukan.');

        return $session;
    }

    /*
    |--------------------------------------------------------------------------
    | HASIL UJIAN
    |--------------------------------------------------------------------------
    */

    // Nilai hanya tampil setelah dinilai lengkap (GRADED), sama seperti di portal siswa
    public function examResults(ParentModel $parent, ?string $studentId = null, ?int $limit = null): Collection {
        $childIds = $this->childIds($parent);
        if ($studentId) $childIds = array_values(array_intersect($childIds, [$studentId]));

        return ExamResult::with(['exam.subject', 'student', 'sessionActivity.session.schedule.classroom'])
            ->whereIn('student_id', $childIds)
            ->whereIn('status', ['SUBMITTED', 'GRADED'])
            ->orderByDesc('submitted_at')
            ->when($limit, fn($q) => $q->limit($limit))
            ->get()
            ->map(function (ExamResult $r) {
                $graded = $r->status === 'GRADED';
                $scale = $r->exam->total_score ?: 100;

                return [
                    'id'               => $r->id,
                    'student_name'     => $r->student?->full_name,
                    'exam_title'       => $r->exam->title,
                    'subject_name'     => $r->exam->subject?->name,
                    'class_name'       => $r->sessionActivity?->session?->schedule?->classroom?->name,
                    'mode'             => $r->session_activity_id ? 'SESSION' : 'SCHEDULED',
                    'submitted_at'     => LocalTime::format($r->submitted_at, 'Y-m-d H:i'),
                    'status'           => $r->status,
                    'score'            => $graded ? (float) $r->score : null,
                    'total_score'      => $scale,
                    'normalized_score' => $graded ? round((float) $r->score / $scale * 100, 2) : null,
                    'total_correct'    => $graded ? $r->total_correct : null,
                    'total_wrong'      => $graded ? $r->total_wrong : null,
                    'total_unanswered' => $graded ? $r->total_unanswered : null,
                    'duration_minutes' => $r->duration_seconds ? (int) ceil($r->duration_seconds / 60) : null,
                    'feedback'         => $graded ? $r->feedback : null,
                ];
            });
    }

    /*
    |--------------------------------------------------------------------------
    | DASHBOARD
    |--------------------------------------------------------------------------
    */

    public function dashboard(ParentModel $parent): array {
        $children = $this->children($parent);
        $childIds = $children->pluck('id')->all();
        $now = Carbon::now(LocalTime::TIMEZONE);
        $today = $now->toDateString();

        // Kehadiran bulan berjalan per anak per kelas (perhitungan yang sama dengan rapor)
        $attendance = collect();
        $memberships = ClassStudent::whereIn('student_id', $childIds)->get()->groupBy('class_id');
        $classes = ClassRoom::whereIn('id', $memberships->keys())->get()->keyBy('id');
        foreach ($memberships as $classId => $rows) {
            $computed = $this->reportService->computeForClass($classes[$classId], $rows->pluck('student_id')->all(), $now->year, $now->month);
            foreach ($computed as $report) {
                $attendance->push([
                    'student_name' => $report['student']['name'],
                    'class_name'   => $report['class']['name'],
                    'held'         => $report['attendance']['held_sessions'],
                    'hadir'        => $report['attendance']['hadir'],
                    'percentage'   => $report['attendance']['percentage'],
                ]);
            }
        }

        $openInvoices = Invoice::with(['student', 'classroom'])
            ->whereIn('student_id', $childIds)
            ->whereIn('status', ['UNPAID', 'PARTIAL'])
            ->withCount(['paymentDetails as pending_payments_count' => fn($q) => $q->whereHas('payment', fn($p) => $p->where('status', 'PENDING'))])
            ->orderBy('due_date')
            ->get();

        $sessions = $this->sessions($parent, $today, $now->copy()->addDays(7)->toDateString());

        $pendingRequests = RescheduleRequest::where('requested_by', Auth::id())->where('status', 'PENDING')->count()
            + StudentRegistrationRequest::where('parent_id', $parent->id)->where('status', 'PENDING')->count();

        return [
            'parent'   => ['name' => $parent->full_name],
            'children' => $children,
            'summary'  => [
                'children_count'        => $children->count(),
                'active_classes_count'  => $memberships->count(),
                'attendance_percentage' => ProgressReportService::percentage($attendance->sum('hadir'), $attendance->sum('held')),
                'attendance_period'     => ProgressReportService::periodLabel($now->year, $now->month),
                'open_invoices_count'   => $openInvoices->count(),
                'outstanding'           => (float) $openInvoices->sum('remaining_amount'),
                'overdue_count'         => $openInvoices->filter(fn($i) => $i->isOverdue())->count(),
                'pending_requests'      => $pendingRequests,
            ],
            'attendance'        => $attendance->values(),
            'today_sessions'    => $sessions->where('session_date', $today)->values(),
            'upcoming_sessions' => $sessions->where('session_date', '>', $today)->where('status', '!=', 'CANCELLED')->take(5)->values(),
            'open_invoices'     => $openInvoices->take(3)->map(fn(Invoice $i) => [
                'id'                  => $i->id,
                'invoice_no'          => $i->invoice_no,
                'student_name'        => $i->student?->full_name,
                'class_name'          => $i->classroom?->name,
                'period_month'        => $i->period_month,
                'period_year'         => $i->period_year,
                'remaining_amount'    => (float) $i->remaining_amount,
                'due_date'            => $i->due_date?->toDateString(),
                'is_overdue'          => $i->isOverdue(),
                'has_pending_payment' => $i->pending_payments_count > 0,
            ])->values(),
            'recent_results' => $this->examResults($parent, null, 5),
            'latest_reports' => $this->reportService->publishedFor($childIds)->take(3)->values(),
        ];
    }
}
