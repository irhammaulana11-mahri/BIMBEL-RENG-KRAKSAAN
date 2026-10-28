<?php
namespace App\Services\Tentor;

use App\Models\Academic\ClassRoom;
use App\Models\Academic\ClassStudent;
use App\Models\Academic\ScheduleSession;
use App\Models\Academic\StudentAttendance;
use App\Models\Admin\Student;
use App\Models\Admin\Tentor;
use App\Models\Exam\ExamResult;
use App\Services\Academic\ProgressReportService;
use App\Support\LocalTime;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Profil tentor dan daftar murid di kelas yang diajarnya.
 */
class TentorPortalService {

    public function currentTentor(): Tentor {
        $tentor = Tentor::with('user')->where('user_id', Auth::id())->first();
        abort_unless($tentor, 403, 'Akun ini tidak terhubung dengan data tentor.');
        return $tentor;
    }

    /**
     * Kelas -> mapel yang diajar tentor: pengampu di kelas, atau tentor pola jadwal/sesi kelas tsb.
     * Hasil: [class_id => [subject_id, ...]]
     */
    public function teachingMap(Tentor $tentor): Collection {
        $assigned = DB::table('academic.class_subjects')->where('tentor_id', $tentor->id)->get(['class_id', 'subject_id']);
        $scheduled = DB::table('academic.schedules')->where('tentor_id', $tentor->id)->get(['class_id', 'subject_id']);
        $sessions = DB::table('academic.schedule_sessions')
            ->join('academic.schedules', 'academic.schedules.id', '=', 'academic.schedule_sessions.schedule_id')
            ->where('academic.schedule_sessions.tentor_id', $tentor->id)
            ->distinct()
            ->get(['academic.schedules.class_id', 'academic.schedule_sessions.subject_id']);

        return $assigned->concat($scheduled)->concat($sessions)
            ->groupBy('class_id')
            ->map(fn($rows) => $rows->pluck('subject_id')->filter()->unique()->values()->all());
    }

    public function profile(Tentor $tentor): array {
        $tentor->loadMissing('subjects.educationLevel');
        $map = $this->teachingMap($tentor);
        $classes = ClassRoom::whereIn('id', $map->keys())->withCount('students')->orderBy('name')->get();

        return [
            'id'             => $tentor->id,
            'name'           => $tentor->user?->name,
            'email'          => $tentor->user?->email,
            'phone'          => $tentor->user?->phone,
            'specialization' => $tentor->specialization,
            'education'      => $tentor->education,
            'gender'         => $tentor->gender,
            'birth_date'     => $tentor->birth_date?->format('Y-m-d'),
            'joining_date'   => $tentor->joining_date?->format('Y-m-d'),
            'address'        => $tentor->address,
            'is_active'      => (bool) $tentor->is_active,
            // Ringkasan mengajar (pengganti tarif per sesi yang hanya dikelola Admin)
            'statistics'     => app(\App\Services\Admin\MasterOverviewService::class)->tentor($tentor)['statistics'],
            'subjects'       => $tentor->subjects->map(fn($s) => ['id' => $s->id, 'name' => $s->name, 'level' => $s->educationLevel?->display_name])->values(),
            'classes'        => $classes->map(fn($c) => [
                'id' => $c->id, 'name' => $c->name, 'class_type' => $c->class_type, 'students_count' => $c->students_count,
            ])->values(),
        ];
    }

    /**
     * Murid di kelas yang diajar tentor, dengan kehadiran & rata-rata nilai pada sesi/mapel tentor ini.
     */
    public function students(Tentor $tentor, array $filters = []): array {
        $map = $this->teachingMap($tentor);
        if (!empty($filters['class_id'])) $map = $map->only([$filters['class_id']]);

        $classes = ClassRoom::whereIn('id', $map->keys())->orderBy('name')->get()->keyBy('id');
        $memberships = ClassStudent::whereIn('class_id', $map->keys())->get(['class_id', 'student_id', 'created_at']);
        $students = Student::whereIn('id', $memberships->pluck('student_id')->unique())->get()->keyBy('id');

        // Sesi tentor ini yang sudah berlangsung, per kelas
        $sessions = ScheduleSession::query()
            ->join('academic.schedules', 'academic.schedules.id', '=', 'academic.schedule_sessions.schedule_id')
            ->where('academic.schedule_sessions.tentor_id', $tentor->id)
            ->whereIn('academic.schedules.class_id', $map->keys())
            ->whereIn('academic.schedule_sessions.status', ProgressReportService::HELD_SESSION_STATUSES)
            ->get(['academic.schedule_sessions.id', 'academic.schedule_sessions.session_date', 'academic.schedules.class_id'])
            ->groupBy('class_id');

        $attendances = StudentAttendance::whereIn('session_id', $sessions->flatten()->pluck('id'))
            ->get(['session_id', 'student_id', 'attendance_status'])
            ->groupBy('student_id');

        // Nilai ujian (GRADED) di mapel yang diajar tentor
        $subjectIds = $map->flatten()->unique()->values();
        $results = ExamResult::with('exam:id,subject_id,total_score,title')
            ->where('status', 'GRADED')
            ->whereIn('student_id', $students->keys())
            ->whereHas('exam', fn($q) => $q->whereIn('subject_id', $subjectIds))
            ->orderByDesc('submitted_at')
            ->get()
            ->groupBy('student_id');

        $rows = $memberships->map(function ($m) use ($classes, $students, $sessions, $attendances, $results, $map) {
            $student = $students->get($m->student_id);
            $class = $classes->get($m->class_id);
            if (!$student || !$class) return null;

            $joined = $m->created_at ? Carbon::parse($m->created_at)->setTimezone(LocalTime::TIMEZONE)->toDateString() : null;
            $mine = ($attendances->get($student->id) ?? collect())->keyBy('session_id');
            $classSessions = ($sessions->get($class->id) ?? collect())
                ->filter(fn($s) => $mine->has($s->id) || !$joined || $s->session_date >= $joined);
            $records = $classSessions->map(fn($s) => $mine->get($s->id))->filter();

            $subjectIds = $map->get($class->id, []);
            $scores = ($results->get($student->id) ?? collect())
                ->filter(fn($r) => in_array($r->exam->subject_id, $subjectIds, true));

            return [
                'student_id'      => $student->id,
                'name'            => $student->full_name,
                'nis'             => $student->nis,
                'gender'          => $student->gender,
                'school_name'     => $student->school_name,
                'grade'           => $student->grade,
                'education_level' => $student->education_level,
                'is_active'       => (bool) $student->is_active,
                'class_id'        => $class->id,
                'class_name'      => $class->name,
                'class_type'      => $class->class_type,
                'held_sessions'   => $classSessions->count(),
                'hadir'           => $records->where('attendance_status', 'HADIR')->count(),
                'izin_sakit'      => $records->whereIn('attendance_status', ['IZIN', 'SAKIT'])->count(),
                'alpa'            => $records->where('attendance_status', 'ALPA')->count(),
                'attendance_percentage' => ProgressReportService::percentage($records->where('attendance_status', 'HADIR')->count(), $classSessions->count()),
                'exam_count'      => $scores->count(),
                'exam_average'    => ProgressReportService::average($scores->map(fn($r) => (float) $r->score / ($r->exam->total_score ?: 100) * 100)),
                'last_exam'       => ($last = $scores->first()) ? [
                    'title' => $last->exam->title,
                    'score' => (float) $last->score,
                    'total_score' => $last->exam->total_score ?: 100,
                    'date'  => LocalTime::format($last->submitted_at, 'Y-m-d'),
                ] : null,
            ];
        })->filter();

        if (!empty($filters['keyword'])) {
            $keyword = mb_strtolower($filters['keyword']);
            $rows = $rows->filter(fn($r) => str_contains(mb_strtolower($r['name']), $keyword) || str_contains(mb_strtolower((string) $r['nis']), $keyword));
        }

        $rows = $rows->sortBy([['class_name', 'asc'], ['name', 'asc']])->values();

        return [
            'data'    => $rows,
            'classes' => ClassRoom::whereIn('id', $this->teachingMap($tentor)->keys())->orderBy('name')->get(['id', 'name'])
                            ->map(fn($c) => ['id' => $c->id, 'name' => $c->name]),
            'summary' => [
                'students'           => $rows->pluck('student_id')->unique()->count(),
                'average_attendance' => ProgressReportService::average($rows->pluck('attendance_percentage')->filter(fn($v) => $v !== null)),
                'average_exam'       => ProgressReportService::average($rows->pluck('exam_average')->filter(fn($v) => $v !== null)),
            ],
        ];
    }
}
