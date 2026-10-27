<?php
namespace App\Services\StudentPortal;

use App\Models\Academic\ClassRoom;
use App\Models\Academic\ClassStudent;
use App\Models\Academic\Curriculum;
use App\Models\Academic\Material;
use App\Models\Academic\ScheduleSession;
use App\Models\Academic\SessionActivity;
use App\Models\Admin\Student;
use App\Models\Exam\Exam;
use App\Models\Exam\ExamResult;
use App\Services\Academic\ProgressReportService;
use App\Support\LocalTime;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

/**
 * Pembelajaran siswa: jadwal sesi kelasnya, aktivitas tiap sesi, dan materi belajar.
 */
class StudentLearningService {

    // Aktivitas yang terlihat siswa (draft & batal disembunyikan)
    public const VISIBLE_ACTIVITY_STATUSES = ['READY', 'IN_PROGRESS', 'COMPLETED'];

    public function __construct(protected ProgressReportService $reportService) {}

    public function currentStudent(): Student {
        $student = Student::where('user_id', Auth::id())->first();
        abort_unless($student, 403, 'Akun ini tidak terhubung dengan data siswa.');
        return $student;
    }

    public function classIds(Student $student): array {
        return ClassStudent::where('student_id', $student->id)->pluck('class_id')->all();
    }

    /*
    |--------------------------------------------------------------------------
    | JADWAL & SESI
    |--------------------------------------------------------------------------
    */

    public function sessions(Student $student, string $from, string $to): Collection {
        $classIds = $this->classIds($student);
        if (empty($classIds)) return collect();

        return ScheduleSession::query()
            ->with([
                'schedule.classroom', 'subject', 'tentor.user', 'location',
                'studentAttendances' => fn($q) => $q->where('student_id', $student->id),
                'activities' => fn($q) => $q->whereIn('status', self::VISIBLE_ACTIVITY_STATUSES),
            ])
            ->whereHas('schedule', fn($q) => $q->whereIn('class_id', $classIds))
            ->whereBetween('session_date', [$from, $to])
            ->orderBy('session_date')->orderBy('start_time')
            ->get()
            ->map(fn(ScheduleSession $s) => $this->presentSession($s));
    }

    public function sessionDetail(Student $student, string $sessionId): array {
        abort_unless(Str::isUuid($sessionId), 404, 'Sesi tidak ditemukan.');

        $session = ScheduleSession::query()
            ->with([
                'schedule.classroom', 'subject', 'tentor.user', 'location',
                'studentAttendances' => fn($q) => $q->where('student_id', $student->id),
                'activities' => fn($q) => $q->whereIn('status', self::VISIBLE_ACTIVITY_STATUSES)->with('activityable'),
            ])
            ->whereHas('schedule', fn($q) => $q->whereIn('class_id', $this->classIds($student)))
            ->where('id', $sessionId)
            ->first();
        abort_unless($session, 404, 'Sesi tidak ditemukan.');

        $myResults = ExamResult::where('student_id', $student->id)
            ->whereIn('session_activity_id', $session->activities->pluck('id'))
            ->get()
            ->keyBy('session_activity_id');

        $data = $this->presentSession($session);
        $data['activities'] = $session->activities->map(function (SessionActivity $a) use ($myResults) {
            $row = $this->presentActivity($a);
            $target = $a->activityable;

            if ($target instanceof Material && $target->is_active) {
                $row['material'] = $this->presentMaterial($target->loadMissing('curriculum.subject', 'tentor.user'));
            }
            if ($target instanceof Exam) {
                $result = $myResults->get($a->id);
                $row['exam'] = [
                    'id'            => $target->id,
                    'title'         => $target->title,
                    'duration'      => $target->duration,
                    'result_id'     => $result?->id,
                    'result_status' => $result?->status,
                    // Nilai hanya tampil setelah dinilai lengkap
                    'score'         => $result?->status === 'GRADED' ? (float) $result->score : null,
                    'total_score'   => $target->total_score ?: 100,
                ];
            }
            return $row;
        })->values();

        return $data;
    }

    private function presentSession(ScheduleSession $s): array {
        $classroom = $s->schedule->classroom;

        return [
            'id'                => $s->id,
            'session_date'      => $s->session_date,
            'start_time'        => substr($s->start_time, 0, 5),
            'end_time'          => substr($s->end_time, 0, 5),
            'status'            => $s->status,
            'meeting_no'        => $s->meeting_no,
            'class_name'        => $classroom?->name,
            'class_type'        => $classroom?->class_type,
            'subject_name'      => $s->subject?->name,
            'tentor_name'       => $s->tentor?->user?->name,
            'location_name'     => $s->location?->location_name,
            'room_name'         => $s->room_name,
            'meeting_url'       => $s->meeting_url,
            'attendance_status' => $s->studentAttendances->first()?->attendance_status,
            'activities_count'  => $s->activities->count(),
            'activities'        => $s->activities->map(fn($a) => $this->presentActivity($a))->values(),
        ];
    }

    private function presentActivity(SessionActivity $a): array {
        return [
            'id'          => $a->id,
            'type'        => $a->activity_type,
            'title'       => $a->title,
            'description' => $a->description,
            'status'      => $a->status,
            'start_time'  => $a->start_time ? substr($a->start_time, 0, 5) : null,
            'end_time'    => $a->end_time ? substr($a->end_time, 0, 5) : null,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | MATERI
    |--------------------------------------------------------------------------
    */

    /**
     * Materi aktif untuk mapel di kelas siswa, dikelompokkan per mapel -> kurikulum (bab).
     */
    public function materials(Student $student, array $filters = []): array {
        $classIds = $this->classIds($student);
        if (empty($classIds)) return ['subjects' => [], 'total' => 0, 'subject_options' => []];

        $classes = ClassRoom::whereIn('id', $classIds)->with('classSubjects')->get();
        $subjectIds = $classes->flatMap(fn($c) => $c->classSubjects->pluck('subject_id'))->unique()->values();
        $levelIds = $classes->pluck('education_level_id')->push($student->education_level_id)->filter()->unique()->values();

        $curriculums = Curriculum::query()
            ->with(['subject', 'materials' => fn($q) => $q->where('is_active', true)->with('tentor.user')->orderBy('sort_order')->orderBy('created_at')])
            ->where('is_active', true)
            ->whereIn('subject_id', $subjectIds)
            // Kurikulum khusus jenjang hanya tampil untuk jenjang kelas/siswa yang sesuai
            ->where(fn($q) => $q->whereNull('education_level_id')->orWhereIn('education_level_id', $levelIds))
            ->when(!empty($filters['subject_id']), fn($q) => $q->where('subject_id', $filters['subject_id']))
            ->orderBy('semester')->orderBy('order_no')->orderBy('title')
            ->get();

        $covered = $this->coveredMaterials($classIds);
        $keyword = !empty($filters['keyword']) ? mb_strtolower($filters['keyword']) : null;

        $subjects = $curriculums->groupBy('subject_id')->map(function ($group) use ($covered, $keyword) {
            $chapters = $group->map(function (Curriculum $c) use ($covered, $keyword) {
                $materials = $c->materials
                    ->filter(fn($m) => !$keyword
                        || str_contains(mb_strtolower($m->title), $keyword)
                        || str_contains(mb_strtolower($c->title), $keyword))
                    ->map(fn($m) => $this->presentMaterial($m, $c) + ['covered_at' => $covered->get($m->id)])
                    ->values();

                return [
                    'id'          => $c->id,
                    'title'       => $c->title,
                    'description' => $c->description,
                    'semester'    => $c->semester,
                    'materials'   => $materials,
                ];
            })->filter(fn($c) => $c['materials']->isNotEmpty())->values();

            $first = $group->first();
            $materials = $chapters->flatMap(fn($c) => $c['materials']);

            return [
                'subject_id'     => $first->subject_id,
                'subject_name'   => $first->subject?->name,
                'chapters'       => $chapters,
                'material_count' => $materials->count(),
                'covered_count'  => $materials->whereNotNull('covered_at')->count(),
            ];
        })->filter(fn($s) => $s['material_count'] > 0)->sortBy('subject_name')->values();

        return [
            'subjects'        => $subjects,
            'total'           => $subjects->sum('material_count'),
            'subject_options' => Curriculum::with('subject')->whereIn('subject_id', $subjectIds)->get()
                ->pluck('subject.name', 'subject_id')->map(fn($name, $id) => ['id' => $id, 'name' => $name])->sortBy('name')->values(),
        ];
    }

    // material_id => tanggal terakhir dibahas (aktivitas MATERIAL/REVIEW selesai di kelas siswa)
    private function coveredMaterials(array $classIds): Collection {
        return SessionActivity::query()
            ->join('academic.schedule_sessions', 'academic.schedule_sessions.id', '=', 'academic.session_activities.schedule_session_id')
            ->join('academic.schedules', 'academic.schedules.id', '=', 'academic.schedule_sessions.schedule_id')
            ->whereIn('academic.schedules.class_id', $classIds)
            ->where('academic.session_activities.activityable_type', 'material')
            ->where('academic.session_activities.status', 'COMPLETED')
            ->groupBy('academic.session_activities.activityable_id')
            ->selectRaw('academic.session_activities.activityable_id as material_id, MAX(academic.schedule_sessions.session_date) as covered_at')
            ->pluck('covered_at', 'material_id');
    }

    private function presentMaterial(Material $m, ?Curriculum $curriculum = null): array {
        $curriculum ??= $m->curriculum;

        return [
            'id'               => $m->id,
            'title'            => $m->title,
            'description'      => $m->description,
            'material_type'    => $m->material_type,
            'file_path'        => $m->file_path,
            'video_url'        => $m->video_url,
            'external_url'     => $m->external_url,
            'duration_minutes' => $m->duration_minutes,
            'curriculum_title' => $curriculum?->title,
            'subject_name'     => $curriculum?->subject?->name,
            'tentor_name'      => $m->tentor?->user?->name,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | DASHBOARD
    |--------------------------------------------------------------------------
    */

    public function dashboard(Student $student): array {
        $now = Carbon::now(LocalTime::TIMEZONE);
        $today = $now->toDateString();
        $classIds = $this->classIds($student);
        $classes = ClassRoom::whereIn('id', $classIds)->with('package')->orderBy('name')->get();

        // Kehadiran bulan berjalan (perhitungan sama dengan rapor)
        $held = 0;
        $hadir = 0;
        foreach ($classes as $class) {
            $report = $this->reportService->computeForClass($class, [$student->id], $now->year, $now->month)[$student->id] ?? null;
            $held += $report['attendance']['held_sessions'] ?? 0;
            $hadir += $report['attendance']['hadir'] ?? 0;
        }

        $sessions = $this->sessions($student, $today, $now->copy()->addDays(7)->toDateString())
            ->where('status', '!=', 'CANCELLED')
            ->values();

        $covered = $this->coveredMaterials($classIds);
        $recentMaterials = Material::with(['curriculum.subject', 'tentor.user'])
            ->whereIn('id', $covered->sortDesc()->keys()->take(5))
            ->where('is_active', true)
            ->get()
            ->map(fn($m) => $this->presentMaterial($m) + ['covered_at' => $covered->get($m->id)])
            ->sortByDesc('covered_at')
            ->values();

        return [
            'student'  => ['id' => $student->id, 'name' => $student->full_name, 'nis' => $student->nis],
            'classes'  => $classes->map(fn($c) => ['id' => $c->id, 'name' => $c->name, 'class_type' => $c->class_type, 'package_name' => $c->package?->package_name])->values(),
            'attendance' => [
                'period'        => ProgressReportService::periodLabel($now->year, $now->month),
                'held_sessions' => $held,
                'hadir'         => $hadir,
                'percentage'    => ProgressReportService::percentage($hadir, $held),
            ],
            'today_sessions'    => $sessions->where('session_date', $today)->values(),
            'upcoming_sessions' => $sessions->where('session_date', '>', $today)->take(5)->values(),
            'recent_materials'  => $recentMaterials,
        ];
    }
}
