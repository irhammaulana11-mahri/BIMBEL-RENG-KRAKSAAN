<?php
namespace App\Services\Admin;

use App\Models\Academic\ClassRoom;
use App\Models\Academic\LearningLocation;
use App\Models\Academic\Schedule;
use App\Models\Academic\ScheduleSession;
use App\Models\Academic\StudentAttendance;
use App\Models\Academic\RescheduleRequest;
use App\Models\Academic\LocationChangeRequest;
use App\Models\Admin\Student;
use App\Models\Admin\Subject;
use App\Models\Admin\Tentor;
use App\Models\Exam\Exam;
use App\Models\Exam\ExamResult;
use App\Models\Finance\Invoice;
use App\Services\Academic\AttendanceLocationService;
use App\Support\LocalTime;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

/**
 * Data drawer detail di menu master Admin (siswa, mata pelajaran, tentor), seluruhnya dari relasi database.
 */
class MasterOverviewService {

    public const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

    public function __construct(protected AttendanceLocationService $locations) {}

    /*
    |--------------------------------------------------------------------------
    | SISWA
    |--------------------------------------------------------------------------
    */

    public function student(Student $student): array {
        $student->load(['user', 'parents.user', 'educationLevel']);
        $classes = ClassRoom::with(['package', 'classSubjects.subject', 'classSubjects.tentor.user', 'location'])
            ->whereHas('students', fn($q) => $q->where('master.students.id', $student->id))
            ->get();

        $schedules = Schedule::with(['subject', 'tentor.user', 'classroom', 'location'])
            ->whereIn('class_id', $classes->pluck('id'))
            ->orderBy('day_of_week')->orderBy('start_time')
            ->get();

        $attendance = StudentAttendance::where('student_id', $student->id)
            ->whereHas('session', fn($q) => $q->where('status', 'COMPLETED'))
            ->selectRaw('attendance_status, count(*) as total')
            ->groupBy('attendance_status')
            ->pluck('total', 'attendance_status');

        $results = ExamResult::with('exam.subject')->where('student_id', $student->id)
            ->where('status', 'GRADED')->latest('submitted_at')->get();

        $invoices = Invoice::where('student_id', $student->id)->where('status', '!=', 'CANCELLED');

        return [
            'id'           => $student->id,
            'full_name'    => $student->full_name,
            'nis'          => $student->nis,
            'gender'       => $student->gender,
            'birth_date'   => $student->birth_date?->format('Y-m-d'),
            'school_name'  => $student->school_name,
            'level'        => $student->educationLevel?->display_name ?? trim("{$student->education_level} {$student->grade}"),
            'is_active'    => (bool) $student->is_active,
            'home'         => [
                'address'   => $student->home_address,
                'latitude'  => $student->home_latitude,
                'longitude' => $student->home_longitude,
            ],
            'account'      => $student->user ? [
                'user_id'   => $student->user->id,
                'email'     => $student->user->email,
                'is_active' => (bool) $student->user->is_active,
            ] : null,
            'parents'      => $student->parents->map(fn($p) => [
                'id'           => $p->id,
                'full_name'    => $p->full_name,
                'relationship' => $p->relationship,
                'occupation'   => $p->occupation,
                'phone'        => $p->user?->phone,
                'email'        => $p->user?->email,
            ])->values(),
            'classes'      => $classes->map(fn($c) => [
                'id'           => $c->id,
                'name'         => $c->name,
                'class_type'   => $c->class_type,
                'package_name' => $c->package?->package_name,
                'subjects'     => $c->classSubjects->map(fn($cs) => $cs->subject?->name)->filter()->unique()->values(),
                'tentors'      => $c->classSubjects->map(fn($cs) => $cs->tentor?->user?->name)->filter()->unique()->values(),
            ])->values(),
            'schedules'    => $this->presentSchedules($schedules),
            'attendance'   => $this->attendanceSummary($attendance),
            'exams'        => [
                'count'   => $results->count(),
                'average' => $results->count() ? round($results->avg(fn($r) => (float) $r->score), 1) : null,
                'recent'  => $results->take(5)->map(fn($r) => [
                    'title'        => $r->exam?->title,
                    'subject_name' => $r->exam?->subject?->name,
                    'score'        => (float) $r->score,
                    'submitted_at' => LocalTime::format($r->submitted_at, 'Y-m-d'),
                ])->values(),
            ],
            'billing'      => [
                'open_count'  => (clone $invoices)->whereIn('status', ['UNPAID', 'PARTIAL'])->count(),
                'outstanding' => (float) (clone $invoices)->sum('remaining_amount'),
            ],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | MATA PELAJARAN
    |--------------------------------------------------------------------------
    */

    public function subject(Subject $subject): array {
        $schedules = Schedule::with(['subject', 'tentor.user', 'classroom', 'location'])
            ->where('subject_id', $subject->id)
            ->orderBy('day_of_week')->orderBy('start_time')
            ->get();

        $exams = Exam::withCount(['questions as questions_count' => fn($q) => $q->where('is_active', true)])
            ->withCount('results')
            ->where('subject_id', $subject->id)
            ->latest()
            ->get();

        $sessions = ScheduleSession::where('subject_id', $subject->id);
        $graded = ExamResult::whereHas('exam', fn($q) => $q->where('subject_id', $subject->id))->where('status', 'GRADED');

        return [
            'schedules'  => $this->presentSchedules($schedules),
            'exams'      => $exams->map(fn($e) => [
                'id'              => $e->id,
                'title'           => $e->title,
                'status'          => $e->status,
                'duration'        => $e->duration,
                'questions_count' => (int) $e->questions_count,
                'results_count'   => (int) $e->results_count,
            ])->values(),
            'statistics' => [
                'classes'           => $schedules->pluck('class_id')->unique()->count(),
                'students'          => DB::table('academic.class_students')->whereIn('class_id', $schedules->pluck('class_id')->unique())->distinct()->count('student_id'),
                'tentors'           => $schedules->pluck('tentor_id')->unique()->count(),
                'sessions_total'    => (clone $sessions)->where('status', '!=', 'CANCELLED')->count(),
                'sessions_done'     => (clone $sessions)->where('status', 'COMPLETED')->count(),
                'attendance'        => $this->attendanceSummary(StudentAttendance::whereHas('session', fn($q) => $q->where('subject_id', $subject->id)->where('status', 'COMPLETED'))
                    ->selectRaw('attendance_status, count(*) as total')->groupBy('attendance_status')->pluck('total', 'attendance_status')),
                'exams_published'   => $exams->where('status', 'PUBLISHED')->count(),
                'exam_results'      => (clone $graded)->count(),
                'exam_average'      => (clone $graded)->count() ? round((float) (clone $graded)->avg('score'), 1) : null,
            ],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | TENTOR
    |--------------------------------------------------------------------------
    */

    public function tentor(Tentor $tentor): array {
        $schedules = Schedule::with(['subject', 'tentor.user', 'classroom', 'location'])
            ->where('tentor_id', $tentor->id)
            ->orderBy('day_of_week')->orderBy('start_time')
            ->get();

        $today = LocalTime::today();
        $monthStart = substr($today, 0, 7) . '-01';
        $sessions = ScheduleSession::where('tentor_id', $tentor->id)->where('status', '!=', 'CANCELLED');
        $attended = DB::table('academic.tentor_attendances')->where('tentor_id', $tentor->id)->where('attendance_status', 'HADIR');

        $upcoming = (clone $sessions)->with(['subject', 'schedule.classroom'])
            ->whereDate('session_date', '>=', $today)
            ->whereIn('status', ['SCHEDULED', 'RESCHEDULED', 'PREPARING', 'IN_PROGRESS'])
            ->orderBy('session_date')->orderBy('start_time')->limit(5)->get();

        return [
            'schedules'  => $this->presentSchedules($schedules),
            'upcoming'   => $upcoming->map(fn($s) => [
                'session_date' => $s->session_date,
                'start_time'   => substr($s->start_time, 0, 5),
                'end_time'     => substr($s->end_time, 0, 5),
                'subject_name' => $s->subject?->name,
                'class_name'   => $s->schedule?->classroom?->name,
                'status'       => $s->status,
            ])->values(),
            'statistics' => [
                'classes'          => $schedules->pluck('class_id')->unique()->count(),
                'students'         => DB::table('academic.class_students')->whereIn('class_id', $schedules->pluck('class_id')->unique())->distinct()->count('student_id'),
                'subjects'         => $tentor->subjects()->count(),
                'sessions_total'   => (clone $sessions)->count(),
                'sessions_done'    => (clone $sessions)->where('status', 'COMPLETED')->count(),
                'sessions_month'   => (clone $sessions)->where('status', 'COMPLETED')->whereDate('session_date', '>=', $monthStart)->count(),
                'teaching_hours'   => round((clone $attended)->sum('teaching_minutes') / 60, 1),
                'late_count'       => (clone $attended)->where('late_minutes', '>', 0)->count(),
                'outside_area'     => (clone $attended)->where('checkin_outside_area', true)->count(),
                'attended'         => (clone $attended)->count(),
            ],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | KELAS
    |--------------------------------------------------------------------------
    */

    public function classroom(ClassRoom $class): array {
        $class->load(['package', 'location', 'educationlevel', 'students.educationLevel', 'classSubjects.subject', 'classSubjects.tentor.user']);
        $type = strtoupper($class->class_type ?? 'REGULER');

        $schedules = Schedule::with(['subject', 'tentor.user', 'classroom', 'location'])
            ->where('class_id', $class->id)->orderBy('day_of_week')->orderBy('start_time')->get();

        // Progres pertemuan per mapel: sesi selesai vs seluruh sesi terjadwal
        $sessionCounts = ScheduleSession::whereIn('schedule_id', $schedules->pluck('id'))
            ->where('status', '!=', 'CANCELLED')
            ->selectRaw("subject_id, count(*) as total, sum(case when status = 'COMPLETED' then 1 else 0 end) as done")
            ->groupBy('subject_id')->get()->keyBy('subject_id');

        $homeStudent = $class->students->first(fn($st) => $st->home_address || $st->home_latitude !== null);
        $location = match ($type) {
            'ONLINE'  => ['label' => 'Online (dari mana saja)', 'address' => null, 'latitude' => null, 'longitude' => null],
            'PRIVATE' => ['label' => $homeStudent ? "Rumah {$homeStudent->full_name}" : 'Rumah siswa (alamat belum diisi)',
                          'address' => $homeStudent?->home_address, 'latitude' => $homeStudent?->home_latitude, 'longitude' => $homeStudent?->home_longitude],
            default   => ['label' => $class->location?->location_name ?? 'Gedung belum ditentukan', 'address' => $class->location?->address,
                          'latitude' => $class->location?->latitude, 'longitude' => $class->location?->longitude],
        };

        $attendance = StudentAttendance::whereHas('session', fn($q) => $q->whereIn('schedule_id', $schedules->pluck('id'))->where('status', 'COMPLETED'))
            ->selectRaw('attendance_status, count(*) as total')->groupBy('attendance_status')->pluck('total', 'attendance_status');

        return [
            'class_type'   => $type,
            'level'        => $class->educationlevel?->display_name ?? $class->education_level,
            'package'      => $class->package ? ['name' => $class->package->package_name, 'price' => (float) $class->package->default_price] : null,
            'location'     => $location,
            'capacity'     => ['students' => $class->students->count(), 'max' => $class->max_students],
            'meeting_per_month' => $class->meeting_per_month,
            'duration_minutes'  => $class->duration_minutes,
            'created_at'   => LocalTime::format($class->created_at, 'Y-m-d'),
            'subjects'     => $class->classSubjects->map(function ($cs) use ($sessionCounts, $class) {
                $count = $sessionCounts->get($cs->subject_id);
                return [
                    'subject_name'   => $cs->subject?->name,
                    'tentor_name'    => $cs->tentor?->user?->name,
                    'specialization' => $cs->tentor?->specialization,
                    'meeting_target' => $cs->meeting_target ?: $class->meeting_per_month,
                    'scheduled'      => (int) ($count?->total ?? 0),
                    'done'           => (int) ($count?->done ?? 0),
                ];
            })->values(),
            'students'     => $class->students->map(fn($st) => [
                'id'          => $st->id,
                'full_name'   => $st->full_name,
                'nis'         => $st->nis,
                'school_name' => $st->school_name,
                'level'       => $st->educationLevel?->display_name ?? trim("{$st->education_level} {$st->grade}"),
                'is_active'   => (bool) $st->is_active,
            ])->values(),
            'schedules'    => $this->presentSchedules($schedules),
            'attendance'   => $this->attendanceSummary($attendance),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | LOKASI BIMBEL
    |--------------------------------------------------------------------------
    */

    // Lokasi dipakai kelas REGULER (classes.learning_location_id) dan/atau jadwal & sesi tertentu
    public function location(LearningLocation $location): array {
        $classes = ClassRoom::withCount('students')
            ->where('learning_location_id', $location->id)
            ->orWhereHas('schedules', fn($q) => $q->where('learning_location_id', $location->id))
            ->orderBy('name')->get();

        $schedules = Schedule::with(['subject', 'tentor.user', 'classroom', 'location'])
            ->where(fn($q) => $q->where('learning_location_id', $location->id)->orWhereIn('class_id', $classes->pluck('id')))
            ->orderBy('day_of_week')->orderBy('start_time')->get();

        $sessions = ScheduleSession::whereIn('schedule_id', $schedules->pluck('id'))->where('status', '!=', 'CANCELLED');
        $monthStart = substr(LocalTime::today(), 0, 7) . '-01';
        $checkins = DB::table('academic.tentor_attendances')->where('target_label', $location->location_name)->whereNotNull('checkin_latitude');

        return [
            'classes'    => $classes->map(fn($c) => [
                'id'             => $c->id,
                'name'           => $c->name,
                'class_type'     => strtoupper($c->class_type ?? 'REGULER'),
                'students_count' => (int) $c->students_count,
                'max_students'   => $c->max_students,
                'is_active'      => (bool) $c->is_active,
            ])->values(),
            'schedules'  => $this->presentSchedules($schedules),
            'statistics' => [
                'classes'         => $classes->count(),
                'students'        => DB::table('academic.class_students')->whereIn('class_id', $classes->pluck('id'))->distinct()->count('student_id'),
                'tentors'         => $schedules->pluck('tentor_id')->unique()->count(),
                'sessions_total'  => (clone $sessions)->count(),
                'sessions_done'   => (clone $sessions)->where('status', 'COMPLETED')->count(),
                'sessions_month'  => (clone $sessions)->where('status', 'COMPLETED')->whereDate('session_date', '>=', $monthStart)->count(),
                'gps_checkins'    => (clone $checkins)->count(),
                'outside_area'    => (clone $checkins)->where('checkin_outside_area', true)->count(),
            ],
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | SESI JADWAL & POLA JADWAL
    |--------------------------------------------------------------------------
    */

    public function session(ScheduleSession $session): array {
        $session->load(['studentAttendances', 'tentorAttendance', 'activities', 'schedule.classroom.students', 'tentor.user']);
        $counts = $session->studentAttendances->countBy('attendance_status');
        $students = $session->schedule?->classroom?->students ?? collect();
        $byStudent = $session->studentAttendances->keyBy('student_id');
        $log = $session->tentorAttendance;
        $tz = fn($v) => LocalTime::format($v, 'Y-m-d H:i');

        // Riwayat dari data nyata: dibuat, pindah jadwal, lokasi sementara, absen masuk/pulang, batal
        $timeline = collect([['at' => $tz($session->created_at), 'title' => 'Sesi dibuat', 'detail' => "Pertemuan ke-{$session->meeting_no} dari generate jadwal", 'tone' => 'blue']]);
        RescheduleRequest::with('requester')->where('session_id', $session->id)->get()->each(fn($r) => $timeline->push([
            'at' => $tz($r->created_at), 'tone' => $r->status === 'APPROVED' ? 'amber' : 'slate',
            'title' => 'Pengajuan pindah jadwal (' . ($r->requester_type === 'PARENT' ? 'orang tua' : 'tentor') . ') - ' . strtolower(['PENDING' => 'menunggu', 'APPROVED' => 'disetujui', 'REJECTED' => 'ditolak', 'CANCELLED' => 'dibatalkan'][$r->status] ?? $r->status),
            'detail' => "Usulan {$r->proposed_date} " . substr($r->proposed_start_time, 0, 5) . " • {$r->reason}",
        ]));
        LocationChangeRequest::where('session_id', $session->id)->get()->each(fn($r) => $timeline->push([
            'at' => $tz($r->created_at), 'tone' => $r->status === 'APPROVED' ? 'purple' : 'slate',
            'title' => 'Pengajuan lokasi sementara - ' . strtolower(['PENDING' => 'menunggu', 'APPROVED' => 'disetujui', 'REJECTED' => 'ditolak', 'CANCELLED' => 'dibatalkan'][$r->status] ?? $r->status),
            'detail' => "{$r->location_name} • {$r->reason}",
        ]));
        if ($log?->checked_in_at) $timeline->push(['at' => $tz($log->checked_in_at), 'title' => 'Tentor absen masuk, sesi dimulai', 'detail' => implode(' • ', AttendanceLocationService::remarks($log)) ?: 'Sesuai lokasi & jam', 'tone' => 'emerald']);
        if ($log?->checked_out_at) $timeline->push(['at' => $tz($log->checked_out_at), 'title' => 'Sesi diselesaikan', 'detail' => "Durasi mengajar {$log->teaching_minutes} menit", 'tone' => 'emerald']);
        if ($session->status === 'CANCELLED') $timeline->push(['at' => $tz($session->updated_at), 'title' => 'Sesi dibatalkan', 'detail' => $session->reason ?: 'Tanpa keterangan', 'tone' => 'rose']);

        return [
            'location'   => strtoupper($session->schedule?->classroom?->class_type ?? '') === 'ONLINE' ? 'Online' : $this->locations->resolveTarget($session)['label'],
            'attendance' => [
                'total_students' => $students->count(),
                'filled'         => $session->studentAttendances->count(),
                'hadir' => (int) ($counts['HADIR'] ?? 0), 'izin' => (int) ($counts['IZIN'] ?? 0),
                'sakit' => (int) ($counts['SAKIT'] ?? 0), 'alpa' => (int) ($counts['ALPA'] ?? 0),
            ],
            'students'   => $students->map(fn($st) => [
                'name' => $st->full_name, 'status' => $byStudent->get($st->id)?->attendance_status ?? 'BELUM',
                'note' => $byStudent->get($st->id)?->note,
            ])->values(),
            'tentor_attendance' => $log ? [
                'status'        => $log->attendance_status,
                'checkin_time'  => LocalTime::format($log->checked_in_at, 'H:i'),
                'checkout_time' => LocalTime::format($log->checked_out_at, 'H:i'),
                'remarks'       => AttendanceLocationService::remarks($log),
                'target_label'  => $log->target_label,
                'distance'      => $log->checkin_distance_meter,
            ] : null,
            'activities' => $session->activities->map(fn($a) => ['title' => $a->title, 'type' => $a->activity_type, 'status' => $a->status])->values(),
            'timeline'   => $timeline->sortBy('at')->values(),
        ];
    }

    public function schedulePattern(Schedule $schedule): array {
        $sessions = ScheduleSession::where('schedule_id', $schedule->id)->orderBy('session_date')->get(['id', 'session_date', 'start_time', 'status', 'meeting_no']);
        $byStatus = $sessions->countBy('status');

        return [
            'total'     => $sessions->count(),
            'by_status' => [
                'SCHEDULED'   => (int) (($byStatus['SCHEDULED'] ?? 0) + ($byStatus['PREPARING'] ?? 0)),
                'RESCHEDULED' => (int) ($byStatus['RESCHEDULED'] ?? 0),
                'IN_PROGRESS' => (int) ($byStatus['IN_PROGRESS'] ?? 0),
                'COMPLETED'   => (int) ($byStatus['COMPLETED'] ?? 0),
                'CANCELLED'   => (int) ($byStatus['CANCELLED'] ?? 0),
            ],
            'next'      => $sessions->first(fn($s) => $s->session_date >= LocalTime::today() && in_array($s->status, ['SCHEDULED', 'RESCHEDULED', 'PREPARING'])),
            'sessions'  => $sessions->map(fn($s) => ['meeting_no' => $s->meeting_no, 'session_date' => $s->session_date, 'start_time' => substr($s->start_time, 0, 5), 'status' => $s->status])->values(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | HELPER
    |--------------------------------------------------------------------------
    */

    private function presentSchedules(Collection $schedules): Collection {
        $next = ScheduleSession::whereIn('schedule_id', $schedules->pluck('id'))
            ->whereDate('session_date', '>=', LocalTime::today())
            ->whereIn('status', ['SCHEDULED', 'RESCHEDULED', 'PREPARING'])
            ->selectRaw('schedule_id, min(session_date) as next_date, count(*) as remaining')
            ->groupBy('schedule_id')
            ->get()
            ->keyBy('schedule_id');

        return $schedules->map(function (Schedule $s) use ($next) {
            $type = strtoupper($s->classroom?->class_type ?? 'REGULER');
            $location = match ($type) {
                'ONLINE'  => 'Online',
                'PRIVATE' => 'Rumah siswa',
                default   => $s->location?->location_name ?? $s->classroom?->location?->location_name ?? '-',
            };

            return [
                'id'           => $s->id,
                'day_name'     => self::DAYS[$s->day_of_week] ?? '-',
                'start_time'   => substr($s->start_time, 0, 5),
                'end_time'     => substr($s->end_time, 0, 5),
                'subject_name' => $s->subject?->name,
                'tentor_name'  => $s->tentor?->user?->name,
                'class_name'   => $s->classroom?->name,
                'class_type'   => $type,
                'location'     => $location . ($s->room_name ? " • {$s->room_name}" : ''),
                'is_active'    => $s->is_active !== false,
                'next_date'    => $next->get($s->id)?->next_date,
                'remaining'    => (int) ($next->get($s->id)?->remaining ?? 0),
            ];
        })->values();
    }

    private function attendanceSummary(Collection $counts): array {
        $total = (int) $counts->sum();
        $present = (int) ($counts['HADIR'] ?? 0);

        return [
            'total' => $total,
            'hadir' => $present,
            'izin'  => (int) ($counts['IZIN'] ?? 0),
            'sakit' => (int) ($counts['SAKIT'] ?? 0),
            'alpa'  => (int) ($counts['ALPA'] ?? 0),
            'rate'  => $total ? round($present / $total * 100) : null,
        ];
    }
}
