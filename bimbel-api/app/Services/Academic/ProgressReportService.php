<?php
namespace App\Services\Academic;

use App\Models\Academic\ClassRoom;
use App\Models\Academic\ClassStudent;
use App\Models\Academic\ProgressReport;
use App\Models\Academic\ProgressReportNote;
use App\Models\Academic\ScheduleSession;
use App\Models\Academic\StudentAttendance;
use App\Models\Admin\Student;
use App\Models\Admin\Subject;
use App\Models\Admin\Tentor;
use App\Models\Exam\ExamResult;
use App\Support\LocalTime;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Rapor perkembangan siswa per kelas per bulan.
 *
 * Kehadiran : sesi kelas yang sudah berlangsung (IN_PROGRESS/COMPLETED) pada bulan tsb
 * Nilai     : hasil ujian GRADED milik kelas (lewat aktivitas sesi atau ujian terjadwal kelas),
 *             dinormalisasi ke skala 0-100, dikelompokkan per bulan pengumpulan (WIB)
 * Catatan   : catatan tentor per mapel + catatan umum Admin
 *
 * Rapor DRAFT dihitung langsung; saat diterbitkan hasilnya dibekukan ke kolom snapshot.
 */
class ProgressReportService {

    public const HELD_SESSION_STATUSES = ['IN_PROGRESS', 'COMPLETED'];

    public const MONTHS = [
        1 => 'Januari', 2 => 'Februari', 3 => 'Maret', 4 => 'April', 5 => 'Mei', 6 => 'Juni',
        7 => 'Juli', 8 => 'Agustus', 9 => 'September', 10 => 'Oktober', 11 => 'November', 12 => 'Desember',
    ];

    // Semester ganjil: Juli-Desember tahun ajaran; genap: Januari-Juni tahun berikutnya
    public const TERMS = ['GANJIL', 'GENAP'];

    public static function periodLabel(int $year, int $month): string {
        return self::MONTHS[$month] . ' ' . $year;
    }

    // "2026-10" -> [2026, 10]
    public static function parsePeriod(string $period): array {
        [$year, $month] = array_map('intval', explode('-', $period));
        return [$year, $month];
    }

    /*
    |--------------------------------------------------------------------------
    | PERHITUNGAN
    |--------------------------------------------------------------------------
    */

    /**
     * Rapor live untuk beberapa siswa dalam satu kelas. Hasil: [student_id => rapor].
     */
    public function computeForClass(ClassRoom $class, array $studentIds, int $year, int $month): array {
        if (empty($studentIds)) return [];

        $start = Carbon::create($year, $month, 1);
        $end = $start->copy()->endOfMonth();

        $sessions = ScheduleSession::query()
            ->whereHas('schedule', fn($q) => $q->where('class_id', $class->id))
            ->whereBetween('session_date', [$start->toDateString(), $end->toDateString()])
            ->whereIn('status', self::HELD_SESSION_STATUSES)
            ->get(['id', 'subject_id', 'tentor_id', 'session_date']);

        // Sesi sebelum siswa masuk kelas tidak dihitung, kecuali absensinya tercatat
        $joinedAt = ClassStudent::where('class_id', $class->id)
            ->whereIn('student_id', $studentIds)
            ->pluck('created_at', 'student_id')
            ->map(fn($at) => $at ? Carbon::parse($at)->setTimezone(LocalTime::TIMEZONE)->toDateString() : null);

        $attendances = StudentAttendance::whereIn('session_id', $sessions->pluck('id'))
            ->whereIn('student_id', $studentIds)
            ->get(['session_id', 'student_id', 'attendance_status'])
            ->groupBy('student_id');

        // Ambil juga bulan sebelumnya untuk tren nilai
        $results = $this->gradedResults($class, $studentIds, $start->copy()->subMonth(), $end);
        $previousKey = $start->copy()->subMonth()->format('Y-m');
        $currentKey = $start->format('Y-m');

        $notes = ProgressReportNote::with('tentor.user')
            ->where('class_id', $class->id)
            ->where('period_year', $year)->where('period_month', $month)
            ->whereIn('student_id', $studentIds)
            ->get()
            ->groupBy('student_id');

        $reports = ProgressReport::where('class_id', $class->id)
            ->where('period_year', $year)->where('period_month', $month)
            ->whereIn('student_id', $studentIds)
            ->get(['student_id', 'general_note', 'ai_recommendation'])
            ->keyBy('student_id');

        $subjects = $this->subjectsOf($class, $sessions, $results, $notes->flatten());
        $students = Student::whereIn('id', $studentIds)->get(['id', 'full_name', 'nis'])->keyBy('id');

        $output = [];
        foreach ($studentIds as $studentId) {
            $student = $students->get($studentId);
            if (!$student) continue;

            $myAttendances = ($attendances->get($studentId) ?? collect())->keyBy('session_id');
            $joined = $joinedAt->get($studentId);
            $mySessions = $sessions->filter(fn($s) => $myAttendances->has($s->id) || !$joined || $s->session_date >= $joined);
            $myResults = $results->get($studentId) ?? collect();
            $current = $myResults->where('period_key', $currentKey);
            $previous = $myResults->where('period_key', $previousKey);
            $myNotes = ($notes->get($studentId) ?? collect())->keyBy('subject_id');

            $subjectRows = $subjects->map(function ($subject) use ($mySessions, $myAttendances, $current, $myNotes) {
                $subjectSessions = $mySessions->where('subject_id', $subject['subject_id']);
                $hadir = $subjectSessions->filter(fn($s) => $myAttendances->get($s->id)?->attendance_status === 'HADIR')->count();
                $exams = $current->where('subject_id', $subject['subject_id']);
                $note = $myNotes->get($subject['subject_id']);

                return [
                    'subject_id'            => $subject['subject_id'],
                    'subject_name'          => $subject['subject_name'],
                    'tentor_name'           => $note?->tentor?->user?->name ?? $subject['tentor_name'],
                    'held_sessions'         => $subjectSessions->count(),
                    'hadir'                 => $hadir,
                    'attendance_percentage' => self::percentage($hadir, $subjectSessions->count()),
                    'exam_count'            => $exams->count(),
                    'exam_average'          => self::average($exams->pluck('score')),
                    'note'                  => $note?->note,
                    'note_by'               => $note?->tentor?->user?->name,
                ];
            })
            // Mapel tanpa sesi, ujian, maupun catatan bulan ini tidak ditampilkan
            ->filter(fn($row) => $row['held_sessions'] > 0 || $row['exam_count'] > 0 || $row['note'])
            ->values();

            $statusCount = fn($status) => $myAttendances->where('attendance_status', $status)->count();
            $hadir = $statusCount('HADIR');
            $currentAverage = self::average($current->pluck('score'));
            $previousAverage = self::average($previous->pluck('score'));

            $output[$studentId] = [
                'period'       => ['year' => $year, 'month' => $month, 'label' => self::periodLabel($year, $month)],
                'student'      => ['id' => $student->id, 'name' => $student->full_name, 'nis' => $student->nis],
                'class'        => ['id' => $class->id, 'name' => $class->name],
                'attendance'   => [
                    'held_sessions' => $mySessions->count(),
                    'hadir'         => $hadir,
                    'izin'          => $statusCount('IZIN'),
                    'sakit'         => $statusCount('SAKIT'),
                    'alpa'          => $statusCount('ALPA'),
                    'not_recorded'  => $mySessions->count() - $myAttendances->count(),
                    'percentage'    => self::percentage($hadir, $mySessions->count()),
                ],
                'exam'         => [
                    'count'            => $current->count(),
                    'average'          => $currentAverage,
                    'previous_average' => $previousAverage,
                    'trend'            => self::trend($currentAverage, $previousAverage),
                ],
                'exams'        => $current->map(fn($r) => collect($r)->except(['period_key', 'student_id'])->all())->values()->all(),
                'subjects'     => $subjectRows->all(),
                'notes_filled' => $subjectRows->whereNotNull('note')->count(),
                'general_note' => $reports->get($studentId)?->general_note,
                // Rekomendasi AI yang sudah ditinjau Admin (dibekukan bersama rapor saat terbit)
                'ai_recommendation' => $reports->get($studentId)?->ai_recommendation,
            ];
        }

        return $output;
    }

    /**
     * Hasil ujian GRADED siswa di kelas ini dalam rentang bulan (WIB), dikelompokkan per siswa.
     */
    private function gradedResults(ClassRoom $class, array $studentIds, Carbon $from, Carbon $to): Collection {
        $fromUtc = Carbon::create($from->year, $from->month, 1, 0, 0, 0, LocalTime::TIMEZONE)->setTimezone(config('app.timezone'));
        $toUtc = Carbon::create($to->year, $to->month, 1, 0, 0, 0, LocalTime::TIMEZONE)->addMonth()->setTimezone(config('app.timezone'));

        return ExamResult::with('exam.subject')
            ->where('status', 'GRADED')
            ->whereIn('student_id', $studentIds)
            ->where('submitted_at', '>=', $fromUtc)
            ->where('submitted_at', '<', $toUtc)
            ->where(function ($q) use ($class) {
                $q->whereHas('sessionActivity.session.schedule', fn($s) => $s->where('class_id', $class->id))
                  ->orWhere(fn($scheduled) => $scheduled
                      ->whereNull('session_activity_id')
                      ->whereHas('exam.classes', fn($c) => $c->where('academic.classes.id', $class->id)));
            })
            ->orderBy('submitted_at')
            ->get()
            ->map(function (ExamResult $result) {
                $scale = $result->exam->total_score ?: 100;
                $submitted = $result->submitted_at->copy()->setTimezone(LocalTime::TIMEZONE);

                return [
                    'student_id'   => $result->student_id,
                    'period_key'   => $submitted->format('Y-m'),
                    'subject_id'   => $result->exam->subject_id,
                    'subject_name' => $result->exam->subject?->name,
                    'title'        => $result->exam->title,
                    'date'         => $submitted->toDateString(),
                    'raw_score'    => (float) $result->score,
                    'total_score'  => $scale,
                    'score'        => round((float) $result->score / $scale * 100, 2),
                ];
            })
            ->groupBy('student_id');
    }

    // Mapel kelas (urut display_order) + mapel lain yang muncul di sesi/ujian/catatan
    private function subjectsOf(ClassRoom $class, Collection $sessions, Collection $results, Collection $notes): Collection {
        $classSubjects = $class->classSubjects()->with(['subject', 'tentor.user'])->get();

        $subjects = $classSubjects->map(fn($cs) => [
            'subject_id'   => $cs->subject_id,
            'subject_name' => $cs->subject?->name,
            'tentor_name'  => $cs->tentor?->user?->name,
        ]);

        $extraIds = $sessions->pluck('subject_id')
            ->merge($results->flatten(1)->pluck('subject_id'))
            ->merge($notes->pluck('subject_id'))
            ->filter()->unique()
            ->diff($subjects->pluck('subject_id'));

        if ($extraIds->isNotEmpty()) {
            Subject::whereIn('id', $extraIds->values())->orderBy('name')->get(['id', 'name'])
                ->each(fn($s) => $subjects->push(['subject_id' => $s->id, 'subject_name' => $s->name, 'tentor_name' => null]));
        }

        return $subjects->values();
    }

    public static function percentage(int $part, int $total): ?float {
        return $total > 0 ? round($part / $total * 100, 1) : null;
    }

    public static function average(Collection $values): ?float {
        return $values->isEmpty() ? null : round($values->avg(), 2);
    }

    // Naik/turun bila selisih rata-rata minimal 1 poin
    public static function trend(?float $current, ?float $previous): ?string {
        if ($current === null || $previous === null) return null;
        if ($current - $previous >= 1) return 'up';
        if ($previous - $current >= 1) return 'down';
        return 'flat';
    }

    /*
    |--------------------------------------------------------------------------
    | ADMIN
    |--------------------------------------------------------------------------
    */

    /**
     * Daftar rapor satu periode: siswa aktif per kelas + rapor terbit milik siswa yang sudah keluar kelas.
     */
    public function listForPeriod(int $year, int $month, array $filters = []): array {
        $classes = ClassRoom::query()
            ->when(!empty($filters['class_id']), fn($q) => $q->where('id', $filters['class_id']))
            ->orderBy('name')
            ->get();

        $published = ProgressReport::where('period_year', $year)->where('period_month', $month)->get()
            ->groupBy('class_id');

        $rows = collect();
        foreach ($classes as $class) {
            $classReports = ($published->get($class->id) ?? collect())->keyBy('student_id');
            $activeIds = ClassStudent::where('class_id', $class->id)->pluck('student_id');
            $publishedIds = $classReports->where('status', 'PUBLISHED')->keys();
            $studentIds = $activeIds->merge($publishedIds)->unique()->values();

            $draftIds = $studentIds->reject(fn($id) => $classReports->get($id)?->isPublished())->values()->all();
            $live = $this->computeForClass($class, $draftIds, $year, $month);

            foreach ($studentIds as $studentId) {
                $report = $classReports->get($studentId);
                $data = $report?->isPublished() ? $report->snapshot : ($live[$studentId] ?? null);
                if (!$data) continue;

                $rows->push([
                    'student_id'            => $studentId,
                    'student_name'          => $data['student']['name'],
                    'class_id'              => $class->id,
                    'class_name'            => $class->name,
                    'report_id'             => $report?->id,
                    'status'                => $report?->status ?? 'DRAFT',
                    'published_at'          => LocalTime::format($report?->published_at, 'Y-m-d H:i'),
                    'held_sessions'         => $data['attendance']['held_sessions'],
                    'hadir'                 => $data['attendance']['hadir'],
                    'attendance_percentage' => $data['attendance']['percentage'],
                    'exam_count'            => $data['exam']['count'],
                    'exam_average'          => $data['exam']['average'],
                    'exam_trend'            => $data['exam']['trend'],
                    'subjects_count'        => count($data['subjects']),
                    'notes_filled'          => $data['notes_filled'],
                    'has_general_note'      => !empty($data['general_note']),
                ]);
            }
        }

        if (!empty($filters['keyword'])) {
            $keyword = mb_strtolower($filters['keyword']);
            $rows = $rows->filter(fn($r) => str_contains(mb_strtolower($r['student_name']), $keyword))->values();
        }
        if (!empty($filters['status'])) {
            $rows = $rows->where('status', strtoupper($filters['status']))->values();
        }

        $rows = $rows->sortBy([['class_name', 'asc'], ['student_name', 'asc']])->values();

        return [
            'data'    => $rows,
            'summary' => [
                'students'           => $rows->count(),
                'published'          => $rows->where('status', 'PUBLISHED')->count(),
                'draft'              => $rows->where('status', 'DRAFT')->count(),
                'average_attendance' => self::average($rows->pluck('attendance_percentage')->filter(fn($v) => $v !== null)),
                'average_exam'       => self::average($rows->pluck('exam_average')->filter(fn($v) => $v !== null)),
                'notes_filled'       => $rows->sum('notes_filled'),
                'notes_expected'     => $rows->sum('subjects_count'),
            ],
            'classes' => $classes->map(fn($c) => ['id' => $c->id, 'name' => $c->name])->values(),
        ];
    }

    /**
     * Detail rapor: snapshot bila sudah terbit, selain itu dihitung langsung.
     */
    public function detail(Student $student, ClassRoom $class, int $year, int $month): array {
        $report = $this->findReport($student->id, $class->id, $year, $month);

        if ($report?->isPublished()) {
            return $this->present($report);
        }

        $this->ensureEnrolled($student->id, $class->id);
        $data = $this->computeForClass($class, [$student->id], $year, $month)[$student->id];

        return array_merge($data, [
            'report_id'    => $report?->id,
            'status'       => 'DRAFT',
            'published_at' => null,
        ]);
    }

    // Simpan rekomendasi AI (hasil generate atau suntingan Admin) pada rapor DRAFT
    public function saveRecommendation(Student $student, ClassRoom $class, int $year, int $month, array $recommendation, bool $edited): ProgressReport {
        $this->ensureEnrolled($student->id, $class->id);

        return DB::transaction(function () use ($student, $class, $year, $month, $recommendation, $edited) {
            $report = $this->lockOrCreate($student->id, $class->id, $year, $month);
            $this->ensureEditable($report);
            $report->update([
                'ai_recommendation' => $recommendation,
                'ai_edited'         => $edited,
                'ai_generated_at'   => $edited ? $report->ai_generated_at : now(),
            ]);
            return $report;
        });
    }

    public function saveGeneralNote(Student $student, ClassRoom $class, int $year, int $month, ?string $note): ProgressReport {
        $this->ensureEnrolled($student->id, $class->id);

        return DB::transaction(function () use ($student, $class, $year, $month, $note) {
            $report = $this->lockOrCreate($student->id, $class->id, $year, $month);
            $this->ensureEditable($report);
            $report->update(['general_note' => $note !== null && trim($note) !== '' ? trim($note) : null]);
            return $report;
        });
    }

    /**
     * Terbitkan rapor siswa kelas (semua siswa aktif bila $studentIds kosong).
     */
    public function publish(ClassRoom $class, int $year, int $month, ?array $studentIds = null): array {
        $this->ensurePeriodStarted($year, $month);

        $activeIds = ClassStudent::where('class_id', $class->id)->pluck('student_id')->all();
        if ($studentIds) {
            $outside = array_diff($studentIds, $activeIds);
            if ($outside) {
                throw ValidationException::withMessages(['student_ids' => 'Sebagian siswa tidak terdaftar di kelas ini.']);
            }
        }
        $targets = $studentIds ?: $activeIds;
        if (empty($targets)) {
            throw ValidationException::withMessages(['class_id' => 'Kelas ini belum memiliki siswa.']);
        }

        return DB::transaction(function () use ($class, $year, $month, $targets) {
            $published = 0;
            $skipped = 0;
            $pending = [];

            foreach ($targets as $studentId) {
                $report = $this->lockOrCreate($studentId, $class->id, $year, $month);
                if ($report->isPublished()) {
                    $skipped++;
                    continue;
                }
                $pending[$studentId] = $report;
            }

            // Hitung setelah baris terkunci agar catatan umum yang tersimpan ikut dibekukan
            $computed = $this->computeForClass($class, array_keys($pending), $year, $month);

            foreach ($pending as $studentId => $report) {
                $report->update([
                    'status'       => 'PUBLISHED',
                    'snapshot'     => $computed[$studentId],
                    'published_at' => now(),
                    'published_by' => Auth::id(),
                ]);
                $published++;
            }

            return ['published' => $published, 'skipped' => $skipped];
        });
    }

    // Tarik kembali ke DRAFT agar catatan/angka bisa diperbarui
    public function unpublish(ProgressReport $report): ProgressReport {
        return DB::transaction(function () use ($report) {
            $report = ProgressReport::lockForUpdate()->findOrFail($report->id);
            if (!$report->isPublished()) {
                throw ValidationException::withMessages(['report' => 'Rapor ini belum diterbitkan.']);
            }
            $report->update(['status' => 'DRAFT', 'snapshot' => null, 'published_at' => null, 'published_by' => null]);
            return $report;
        });
    }

    // Bentuk rapor terbit untuk ditampilkan (Admin, orang tua, siswa)
    public function present(ProgressReport $report): array {
        return array_merge($report->snapshot, [
            'report_id'    => $report->id,
            'status'       => $report->status,
            'published_at' => LocalTime::format($report->published_at, 'Y-m-d H:i'),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | ORANG TUA & SISWA (hanya rapor terbit)
    |--------------------------------------------------------------------------
    */

    public function publishedFor(array $studentIds): Collection {
        return ProgressReport::where('status', 'PUBLISHED')
            ->whereIn('student_id', $studentIds)
            ->orderByDesc('period_year')->orderByDesc('period_month')
            ->get()
            ->map(fn(ProgressReport $r) => [
                'report_id'             => $r->id,
                'period'                => $r->snapshot['period'],
                'student'               => $r->snapshot['student'],
                'class'                 => $r->snapshot['class'],
                'attendance_percentage' => $r->snapshot['attendance']['percentage'],
                'exam_average'          => $r->snapshot['exam']['average'],
                'exam_count'            => $r->snapshot['exam']['count'],
                'exam_trend'            => $r->snapshot['exam']['trend'],
                'published_at'          => LocalTime::format($r->published_at, 'Y-m-d H:i'),
            ]);
    }

    public function findPublishedFor(array $studentIds, string $reportId): array {
        abort_unless(Str::isUuid($reportId), 404, 'Rapor tidak ditemukan.');

        $report = ProgressReport::where('status', 'PUBLISHED')
            ->whereIn('student_id', $studentIds)
            ->where('id', $reportId)
            ->first();
        abort_unless($report, 404, 'Rapor tidak ditemukan.');

        return $this->present($report);
    }

    /*
    |--------------------------------------------------------------------------
    | REKAP SEMESTER (dari rapor terbit)
    |--------------------------------------------------------------------------
    */

    public static function termMonths(int $academicYear, string $term): array {
        return $term === 'GANJIL'
            ? array_map(fn($m) => [$academicYear, $m], range(7, 12))
            : array_map(fn($m) => [$academicYear + 1, $m], range(1, 6));
    }

    public static function termLabel(int $academicYear, string $term): string {
        return 'Semester ' . ucfirst(strtolower($term)) . ' ' . $academicYear . '/' . ($academicYear + 1);
    }

    // Tahun ajaran & semester yang sedang berjalan (WIB)
    public static function currentTerm(): array {
        $now = Carbon::now(LocalTime::TIMEZONE);
        return $now->month >= 7 ? [$now->year, 'GANJIL'] : [$now->year - 1, 'GENAP'];
    }

    private function termReports(int $academicYear, string $term): \Illuminate\Database\Eloquent\Builder {
        $months = self::termMonths($academicYear, $term);

        return ProgressReport::where('status', 'PUBLISHED')
            ->where(function ($q) use ($months) {
                foreach ($months as [$year, $month]) {
                    $q->orWhere(fn($p) => $p->where('period_year', $year)->where('period_month', $month));
                }
            });
    }

    /**
     * Ringkasan semester per siswa-kelas. filters.student_ids membatasi siswa (orang tua/siswa).
     */
    public function semesterList(int $academicYear, string $term, array $filters = []): Collection {
        $reports = $this->termReports($academicYear, $term)
            ->when(!empty($filters['class_id']), fn($q) => $q->where('class_id', $filters['class_id']))
            ->when(array_key_exists('student_ids', $filters), fn($q) => $q->whereIn('student_id', $filters['student_ids']))
            ->get();

        $rows = $reports->groupBy(fn($r) => $r->student_id . '|' . $r->class_id)
            ->map(fn($group) => $this->aggregateSemester($group, $academicYear, $term, false));

        if (!empty($filters['keyword'])) {
            $keyword = mb_strtolower($filters['keyword']);
            $rows = $rows->filter(fn($r) => str_contains(mb_strtolower($r['student']['name']), $keyword));
        }

        return $rows->sortBy([['class.name', 'asc'], ['student.name', 'asc']])->values();
    }

    public function semesterDetail(string $studentId, string $classId, int $academicYear, string $term): ?array {
        $reports = $this->termReports($academicYear, $term)
            ->where('student_id', $studentId)
            ->where('class_id', $classId)
            ->get();

        return $reports->isEmpty() ? null : $this->aggregateSemester($reports, $academicYear, $term, true);
    }

    private function aggregateSemester(Collection $reports, int $academicYear, string $term, bool $withDetail): array {
        $reports = $reports->sortBy(fn($r) => sprintf('%04d%02d', $r->period_year, $r->period_month))->values();
        $snapshots = $reports->pluck('snapshot');
        $latest = $snapshots->last();

        $held = $snapshots->sum('attendance.held_sessions');
        $hadir = $snapshots->sum('attendance.hadir');
        $scores = $snapshots->flatMap(fn($s) => collect($s['exams'])->pluck('score'));

        $months = $reports->map(fn($r) => [
            'report_id'             => $r->id,
            'year'                  => $r->period_year,
            'month'                 => $r->period_month,
            'label'                 => self::periodLabel($r->period_year, $r->period_month),
            'attendance_percentage' => $r->snapshot['attendance']['percentage'],
            'exam_average'          => $r->snapshot['exam']['average'],
            'exam_count'            => $r->snapshot['exam']['count'],
        ]);

        $result = [
            'academic_year'  => $academicYear,
            'term'           => $term,
            'label'          => self::termLabel($academicYear, $term),
            'student'        => $latest['student'],
            'class'          => $latest['class'],
            'months_count'   => $reports->count(),
            'months'         => $months->values()->all(),
            'attendance'     => [
                'held_sessions' => $held,
                'hadir'         => $hadir,
                'izin'          => $snapshots->sum('attendance.izin'),
                'sakit'         => $snapshots->sum('attendance.sakit'),
                'alpa'          => $snapshots->sum('attendance.alpa'),
                'percentage'    => self::percentage($hadir, $held),
            ],
            'exam'           => [
                'count'   => $scores->count(),
                'average' => self::average($scores),
            ],
        ];

        if (!$withDetail) return $result;

        // Per mapel: gabungan kehadiran, nilai, dan catatan tiap bulan
        $subjects = [];
        foreach ($reports as $report) {
            $snapshot = $report->snapshot;
            $label = self::periodLabel($report->period_year, $report->period_month);
            $examsBySubject = collect($snapshot['exams'])->groupBy('subject_id');

            foreach ($snapshot['subjects'] as $row) {
                $key = $row['subject_id'];
                $subjects[$key] ??= [
                    'subject_id' => $key, 'subject_name' => $row['subject_name'], 'tentor_name' => $row['tentor_name'],
                    'held_sessions' => 0, 'hadir' => 0, 'scores' => [], 'notes' => [],
                ];
                $subjects[$key]['tentor_name'] = $row['tentor_name'] ?? $subjects[$key]['tentor_name'];
                $subjects[$key]['held_sessions'] += $row['held_sessions'];
                $subjects[$key]['hadir'] += $row['hadir'];
                $subjects[$key]['scores'] = array_merge($subjects[$key]['scores'], ($examsBySubject->get($key) ?? collect())->pluck('score')->all());
                if (!empty($row['note'])) {
                    $subjects[$key]['notes'][] = ['period_label' => $label, 'note' => $row['note'], 'note_by' => $row['note_by']];
                }
            }
        }

        $result['subjects'] = collect($subjects)->map(fn($s) => [
            'subject_id'            => $s['subject_id'],
            'subject_name'          => $s['subject_name'],
            'tentor_name'           => $s['tentor_name'],
            'held_sessions'         => $s['held_sessions'],
            'hadir'                 => $s['hadir'],
            'attendance_percentage' => self::percentage($s['hadir'], $s['held_sessions']),
            'exam_count'            => count($s['scores']),
            'exam_average'          => self::average(collect($s['scores'])),
            'notes'                 => $s['notes'],
        ])->values()->all();

        $result['general_notes'] = $reports
            ->filter(fn($r) => !empty($r->snapshot['general_note']))
            ->map(fn($r) => ['period_label' => self::periodLabel($r->period_year, $r->period_month), 'note' => $r->snapshot['general_note']])
            ->values()->all();

        return $result;
    }

    /*
    |--------------------------------------------------------------------------
    | TENTOR: CATATAN PER MAPEL
    |--------------------------------------------------------------------------
    */

    /**
     * Pasangan kelas-mapel yang diajar tentor: pengampu di kelas, atau mengajar sesi pada bulan tsb.
     */
    public function tentorGroups(Tentor $tentor, int $year, int $month): Collection {
        $start = Carbon::create($year, $month, 1);

        $assigned = DB::table('academic.class_subjects')
            ->where('tentor_id', $tentor->id)
            ->get(['class_id', 'subject_id']);

        $taught = ScheduleSession::query()
            ->join('academic.schedules', 'academic.schedules.id', '=', 'academic.schedule_sessions.schedule_id')
            ->where('academic.schedule_sessions.tentor_id', $tentor->id)
            ->whereBetween('academic.schedule_sessions.session_date', [$start->toDateString(), $start->copy()->endOfMonth()->toDateString()])
            ->whereIn('academic.schedule_sessions.status', self::HELD_SESSION_STATUSES)
            ->distinct()
            ->get(['academic.schedules.class_id', 'academic.schedule_sessions.subject_id']);

        return $assigned->concat($taught->map(fn($s) => (object) ['class_id' => $s->class_id, 'subject_id' => $s->subject_id]))
            ->unique(fn($g) => $g->class_id . '|' . $g->subject_id)
            ->values();
    }

    public function notesForTentor(Tentor $tentor, int $year, int $month): array {
        $groups = $this->tentorGroups($tentor, $year, $month);
        if ($groups->isEmpty()) return [];

        $classes = ClassRoom::whereIn('id', $groups->pluck('class_id')->unique())->get()->keyBy('id');
        $subjectNames = Subject::whereIn('id', $groups->pluck('subject_id')->unique())->pluck('name', 'id');

        $output = [];
        foreach ($groups->groupBy('class_id') as $classId => $classGroups) {
            $class = $classes->get($classId);
            if (!$class) continue;

            $studentIds = ClassStudent::where('class_id', $classId)->pluck('student_id')->all();
            $computed = $this->computeForClass($class, $studentIds, $year, $month);
            $locked = ProgressReport::where('class_id', $classId)
                ->where('period_year', $year)->where('period_month', $month)
                ->where('status', 'PUBLISHED')
                ->pluck('student_id')->flip();

            foreach ($classGroups as $group) {
                $students = collect($computed)->map(function ($report) use ($group, $locked) {
                    $row = collect($report['subjects'])->firstWhere('subject_id', $group->subject_id);
                    return [
                        'student_id'            => $report['student']['id'],
                        'student_name'          => $report['student']['name'],
                        'held_sessions'         => $row['held_sessions'] ?? 0,
                        'hadir'                 => $row['hadir'] ?? 0,
                        'attendance_percentage' => $row['attendance_percentage'] ?? null,
                        'exam_count'            => $row['exam_count'] ?? 0,
                        'exam_average'          => $row['exam_average'] ?? null,
                        'note'                  => $row['note'] ?? null,
                        'note_by'               => $row['note_by'] ?? null,
                        'locked'                => $locked->has($report['student']['id']),
                    ];
                })->sortBy('student_name')->values();

                $output[] = [
                    'class_id'      => $classId,
                    'class_name'    => $class->name,
                    'subject_id'    => $group->subject_id,
                    'subject_name'  => $subjectNames->get($group->subject_id),
                    'students'      => $students->all(),
                    'notes_filled'  => $students->whereNotNull('note')->count(),
                ];
            }
        }

        return collect($output)->sortBy([['class_name', 'asc'], ['subject_name', 'asc']])->values()->all();
    }

    /**
     * Simpan catatan tentor untuk beberapa siswa satu kelas-mapel. Catatan kosong = hapus.
     */
    public function saveTentorNotes(Tentor $tentor, string $classId, string $subjectId, int $year, int $month, array $notes): int {
        $this->ensurePeriodStarted($year, $month);

        $allowed = $this->tentorGroups($tentor, $year, $month)
            ->contains(fn($g) => $g->class_id === $classId && $g->subject_id === $subjectId);
        abort_unless($allowed, 403, 'Anda tidak mengajar mapel ini di kelas tersebut.');

        $studentIds = collect($notes)->pluck('student_id')->all();
        $enrolled = ClassStudent::where('class_id', $classId)->whereIn('student_id', $studentIds)->pluck('student_id')->all();
        if (count(array_diff($studentIds, $enrolled)) > 0) {
            throw ValidationException::withMessages(['notes' => 'Sebagian siswa tidak terdaftar di kelas ini.']);
        }

        return DB::transaction(function () use ($tentor, $classId, $subjectId, $year, $month, $notes, $studentIds) {
            $locked = ProgressReport::where('class_id', $classId)
                ->where('period_year', $year)->where('period_month', $month)
                ->whereIn('student_id', $studentIds)
                ->where('status', 'PUBLISHED')
                ->lockForUpdate()
                ->with('student')
                ->get();

            if ($locked->isNotEmpty()) {
                throw ValidationException::withMessages([
                    'notes' => 'Rapor sudah diterbitkan untuk: ' . $locked->pluck('student.full_name')->join(', ') . '. Minta Admin menarik rapor bila catatan perlu diubah.',
                ]);
            }

            $saved = 0;
            foreach ($notes as $item) {
                $key = [
                    'student_id' => $item['student_id'], 'class_id' => $classId, 'subject_id' => $subjectId,
                    'period_year' => $year, 'period_month' => $month,
                ];
                $text = trim((string) ($item['note'] ?? ''));

                if ($text === '') {
                    ProgressReportNote::where($key)->delete();
                    continue;
                }

                ProgressReportNote::updateOrCreate($key, ['note' => $text, 'tentor_id' => $tentor->id]);
                $saved++;
            }

            return $saved;
        });
    }

    /*
    |--------------------------------------------------------------------------
    | HELPER
    |--------------------------------------------------------------------------
    */

    private function findReport(string $studentId, string $classId, int $year, int $month): ?ProgressReport {
        return ProgressReport::where([
            'student_id' => $studentId, 'class_id' => $classId, 'period_year' => $year, 'period_month' => $month,
        ])->first();
    }

    private function lockOrCreate(string $studentId, string $classId, int $year, int $month): ProgressReport {
        $key = ['student_id' => $studentId, 'class_id' => $classId, 'period_year' => $year, 'period_month' => $month];

        $report = ProgressReport::where($key)->lockForUpdate()->first();
        if ($report) return $report;

        // Baris baru: hindari bentrok bila dua permintaan membuat rapor yang sama bersamaan
        DB::statement(
            "INSERT INTO academic.progress_reports (id, student_id, class_id, period_year, period_month, status, created_by, created_at, updated_at)
             VALUES (uuid_generate_v4(), ?, ?, ?, ?, 'DRAFT', ?, now(), now())
             ON CONFLICT (student_id, class_id, period_year, period_month) DO NOTHING",
            [$studentId, $classId, $year, $month, Auth::id()]
        );

        return ProgressReport::where($key)->lockForUpdate()->firstOrFail();
    }

    private function ensureEditable(ProgressReport $report): void {
        if ($report->isPublished()) {
            throw ValidationException::withMessages(['report' => 'Rapor sudah diterbitkan. Tarik rapor terlebih dahulu untuk mengubahnya.']);
        }
    }

    private function ensureEnrolled(string $studentId, string $classId): void {
        $enrolled = ClassStudent::where('class_id', $classId)->where('student_id', $studentId)->exists();
        if (!$enrolled) {
            throw ValidationException::withMessages(['student_id' => 'Siswa tidak terdaftar di kelas ini.']);
        }
    }

    private function ensurePeriodStarted(int $year, int $month): void {
        $now = Carbon::now(LocalTime::TIMEZONE);
        if (sprintf('%04d-%02d', $year, $month) > $now->format('Y-m')) {
            throw ValidationException::withMessages(['period' => 'Periode rapor belum berjalan.']);
        }
    }
}
