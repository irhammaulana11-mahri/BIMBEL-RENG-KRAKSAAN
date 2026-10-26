<?php
namespace App\Services\Exam;

use App\Models\Academic\SessionActivity;
use App\Models\Admin\Student;
use App\Models\Exam\Exam;
use App\Models\Exam\ExamAnswer;
use App\Models\Exam\ExamResult;
use App\Models\Exam\Question;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Ujian online siswa dan penilaiannya.
 *
 * Akses ujian:
 * - SESI      : aktivitas EXAM sedang berjalan (IN_PROGRESS) pada sesi kelas siswa
 * - TERJADWAL : exam PUBLISHED, now di antara opens_at-closes_at, siswa anggota exam_classes
 *
 * Status hasil: IN_PROGRESS -> SUBMITTED (ada essay belum dinilai) -> GRADED
 */
class ExamAttemptService {

    // Toleransi keterlambatan jaringan saat menyimpan jawaban di detik terakhir
    private const GRACE_SECONDS = 30;

    /*
    |--------------------------------------------------------------------------
    | SISWA
    |--------------------------------------------------------------------------
    */

    public function currentStudent(): Student {
        $student = Student::where('user_id', Auth::id())->first();
        if (!$student) abort(403, 'Akun ini tidak terhubung dengan data siswa.');
        return $student;
    }

    public function studentClassIds(Student $student): array {
        return DB::table('academic.class_students')->where('student_id', $student->id)->pluck('class_id')->all();
    }

    /**
     * Ujian yang bisa dikerjakan sekarang + riwayat hasil siswa.
     */
    public function listForStudent(Student $student): array {
        $this->finalizeExpiredFor($student);

        $classIds = $this->studentClassIds($student);
        $results = ExamResult::with('exam.subject')
            ->where('student_id', $student->id)
            ->orderByDesc('created_at')
            ->get();

        $available = collect();

        // 1. Ujian dari aktivitas sesi yang sedang berjalan
        $activities = SessionActivity::with(['session.subject', 'session.schedule.classroom', 'activityable'])
            ->where('activity_type', 'EXAM')
            ->where('status', 'IN_PROGRESS')
            ->where('activityable_type', 'exam')
            ->whereHas('session.schedule', fn($q) => $q->whereIn('class_id', $classIds))
            ->get();

        foreach ($activities as $activity) {
            $exam = $activity->activityable;
            if (!$exam || $exam->status !== 'PUBLISHED') continue;

            $result = $results->first(fn($r) => $r->session_activity_id === $activity->id);
            if ($result && $result->status !== 'IN_PROGRESS') continue;

            $available->push($this->availableItem($exam, 'SESSION', $result, [
                'session_activity_id' => $activity->id,
                'activity_title'      => $activity->title,
                'class_name'          => $activity->session->schedule->classroom->name ?? '-',
                'closes_at'           => null,
            ]));
        }

        // 2. Ujian terjadwal yang sedang dibuka
        $scheduled = Exam::with('subject')
            ->where('status', 'PUBLISHED')
            ->whereNotNull('opens_at')
            ->where('opens_at', '<=', now())
            ->where('closes_at', '>', now())
            ->whereHas('classes', fn($q) => $q->whereIn('academic.classes.id', $classIds))
            ->get();

        foreach ($scheduled as $exam) {
            $result = $results->first(fn($r) => $r->exam_id === $exam->id && $r->session_activity_id === null);
            if ($result && $result->status !== 'IN_PROGRESS') continue;

            $available->push($this->availableItem($exam, 'SCHEDULED', $result, [
                'session_activity_id' => null,
                'activity_title'      => null,
                'class_name'          => null,
                'closes_at'           => $exam->closes_at,
            ]));
        }

        // 3. Ujian terjadwal yang akan datang (informasi)
        $upcoming = Exam::with('subject')
            ->where('status', 'PUBLISHED')
            ->where('opens_at', '>', now())
            ->whereHas('classes', fn($q) => $q->whereIn('academic.classes.id', $classIds))
            ->orderBy('opens_at')
            ->get();

        return [
            'available' => $available->values(),
            'upcoming'  => $upcoming,
            'history'   => $results->where('status', '!=', 'IN_PROGRESS')->values(),
        ];
    }

    /**
     * Mulai (atau lanjutkan) ujian.
     */
    public function start(Student $student, Exam $exam, ?string $sessionActivityId): ExamResult {
        if ($exam->status !== 'PUBLISHED') {
            throw ValidationException::withMessages(['exam' => ['Ujian belum diterbitkan.']]);
        }

        $classIds = $this->studentClassIds($student);
        $deadline = null;

        if ($sessionActivityId) {
            $activity = SessionActivity::with('session.schedule')->find($sessionActivityId);

            $valid = $activity
                && $activity->activity_type === 'EXAM'
                && $activity->activityable_type === 'exam'
                && $activity->activityable_id === $exam->id
                && in_array($activity->session->schedule->class_id ?? null, $classIds);

            if (!$valid) abort(403, 'Anda tidak terdaftar pada sesi ujian ini.');
        } else {
            $isMember = $exam->classes()->whereIn('academic.classes.id', $classIds)->exists();
            if (!$exam->isScheduled() || !$isMember) abort(403, 'Anda tidak terdaftar pada ujian ini.');
            $deadline = $exam->closes_at;
        }

        $existing = ExamResult::where('student_id', $student->id)
            ->where('exam_id', $exam->id)
            ->where('session_activity_id', $sessionActivityId)
            ->first();

        if ($existing) {
            if ($existing->isExpired()) $this->finalize($existing);
            if ($existing->status !== 'IN_PROGRESS') {
                throw ValidationException::withMessages(['exam' => ['Anda sudah mengerjakan ujian ini.']]);
            }
            return $existing;
        }

        // Ujian baru hanya bisa dimulai saat aktivitas berjalan / jadwal sedang dibuka
        if ($sessionActivityId && $activity->status !== 'IN_PROGRESS') {
            throw ValidationException::withMessages(['exam' => ['Ujian belum dimulai atau sudah ditutup oleh tentor.']]);
        }
        if (!$sessionActivityId && !(now()->greaterThanOrEqualTo($exam->opens_at) && now()->lessThan($exam->closes_at))) {
            throw ValidationException::withMessages(['exam' => ['Ujian tidak sedang dibuka.']]);
        }

        $startedAt = now();
        $expiresAt = $startedAt->copy()->addMinutes($exam->duration);
        if ($deadline && $deadline->lessThan($expiresAt)) $expiresAt = $deadline->copy();

        return ExamResult::create([
            'exam_id'             => $exam->id,
            'student_id'          => $student->id,
            'session_activity_id' => $sessionActivityId,
            'status'              => 'IN_PROGRESS',
            'started_at'          => $startedAt,
            'expires_at'          => $expiresAt,
        ]);
    }

    public function findOwnedResult(Student $student, string $resultId): ExamResult {
        $result = ExamResult::with('exam')->where('student_id', $student->id)->findOrFail($resultId);
        if ($this->isPastGrace($result)) $this->finalize($result);
        return $result->refresh();
    }

    /**
     * Simpan satu jawaban (autosave).
     */
    public function saveAnswer(ExamResult $result, string $questionId, ?string $answer): ExamAnswer {
        if ($result->status !== 'IN_PROGRESS') {
            $timedOut = $result->expires_at && $result->submitted_at && $result->submitted_at->greaterThanOrEqualTo($result->expires_at);
            throw ValidationException::withMessages(['answer' => [$timedOut
                ? 'Waktu ujian sudah habis. Jawaban Anda telah dikumpulkan otomatis.'
                : 'Ujian sudah dikumpulkan.']]);
        }

        if ($this->isPastGrace($result)) {
            $this->finalize($result);
            throw ValidationException::withMessages(['answer' => ['Waktu ujian sudah habis. Jawaban Anda telah dikumpulkan otomatis.']]);
        }

        $question = Question::where('exam_id', $result->exam_id)->where('is_active', true)->find($questionId);
        if (!$question) {
            throw ValidationException::withMessages(['question_id' => ['Soal tidak ditemukan pada ujian ini.']]);
        }

        $answer = $answer !== null ? trim($answer) : null;
        if ($answer !== null && $answer !== '' && in_array($question->question_type, ['MULTIPLE_CHOICE', 'TRUE_FALSE'])) {
            $answer = strtoupper($answer);
            if (!array_key_exists($answer, $question->options())) {
                throw ValidationException::withMessages(['answer' => ['Pilihan jawaban tidak valid.']]);
            }
        }

        return ExamAnswer::updateOrCreate(
            ['exam_result_id' => $result->id, 'question_id' => $question->id],
            ['answer' => $answer === '' ? null : $answer]
        );
    }

    /**
     * Kumpulkan ujian: nilai otomatis untuk PG/benar-salah/isian, essay menunggu tentor.
     */
    public function finalize(ExamResult $result): ExamResult {
        if ($result->status !== 'IN_PROGRESS') return $result;

        return DB::transaction(function () use ($result) {
            $result = ExamResult::whereKey($result->id)->lockForUpdate()->first();
            if ($result->status !== 'IN_PROGRESS') return $result;

            $questions = Question::where('exam_id', $result->exam_id)->where('is_active', true)->get();
            $answers = ExamAnswer::where('exam_result_id', $result->id)->get()->keyBy('question_id');
            $now = now();

            foreach ($questions as $question) {
                $answer = $answers->get($question->id) ?? new ExamAnswer([
                    'exam_result_id' => $result->id,
                    'question_id'    => $question->id,
                ]);

                $isBlank = $answer->answer === null || trim($answer->answer) === '';

                if ($question->isAutoGraded() || $isBlank) {
                    // Essay kosong langsung bernilai 0, tidak perlu dinilai tentor
                    $isCorrect = $isBlank ? false : $question->checkAnswer($answer->answer);
                    $answer->fill([
                        'is_correct' => $isCorrect,
                        'score'      => $isCorrect ? $question->score : 0,
                        'graded_at'  => $now,
                    ]);
                }

                $answer->save();
            }

            // Tutup di expires_at jika diselesaikan otomatis karena waktu habis
            $submittedAt = $result->expires_at && $now->greaterThan($result->expires_at) ? $result->expires_at : $now;

            $result->update([
                'submitted_at'     => $submittedAt,
                'duration_seconds' => max(0, (int) $result->started_at->diffInSeconds($submittedAt)),
            ]);

            return $this->recalculate($result);
        });
    }

    public function finalizeExpiredFor(Student $student): void {
        ExamResult::where('student_id', $student->id)
            ->where('status', 'IN_PROGRESS')
            ->where('expires_at', '<=', now()->subSeconds(self::GRACE_SECONDS))
            ->get()
            ->each(fn($result) => $this->finalize($result));
    }

    /*
    |--------------------------------------------------------------------------
    | PENILAIAN (Tentor / Admin)
    |--------------------------------------------------------------------------
    */

    /**
     * Nilai jawaban essay. $grades: [['answer_id' => ..., 'score' => ..., 'feedback' => ...]]
     */
    public function grade(ExamResult $result, array $grades, ?string $feedback): ExamResult {
        if ($result->status === 'IN_PROGRESS') {
            throw ValidationException::withMessages(['status' => ['Siswa belum mengumpulkan ujian ini.']]);
        }

        return DB::transaction(function () use ($result, $grades, $feedback) {
            $answers = ExamAnswer::with('question')->where('exam_result_id', $result->id)->get()->keyBy('id');

            foreach ($grades as $grade) {
                $answer = $answers->get($grade['answer_id']);
                if (!$answer) {
                    throw ValidationException::withMessages(['grades' => ['Jawaban tidak ditemukan pada hasil ujian ini.']]);
                }
                if ($answer->question->question_type !== 'ESSAY') {
                    throw ValidationException::withMessages(['grades' => ['Hanya jawaban essay yang dinilai manual.']]);
                }

                $max = $answer->question->score;
                if ($grade['score'] > $max) {
                    throw ValidationException::withMessages(['grades' => ["Nilai maksimal untuk soal ini adalah {$max}."]]);
                }

                $answer->update([
                    'score'            => $grade['score'],
                    'is_correct'       => (float) $grade['score'] >= $max,
                    'teacher_feedback' => $grade['feedback'] ?? null,
                    'graded_at'        => now(),
                ]);
            }

            if ($feedback !== null) $result->update(['feedback' => $feedback]);

            return $this->recalculate($result, Auth::id());
        });
    }

    /**
     * Hitung ulang total & nilai akhir (skala total_score exam, default 100).
     */
    public function recalculate(ExamResult $result, ?string $gradedBy = null): ExamResult {
        $questions = Question::where('exam_id', $result->exam_id)->where('is_active', true)->get()->keyBy('id');
        $answers = ExamAnswer::where('exam_result_id', $result->id)->whereIn('question_id', $questions->keys())->get();

        $maxScore = $questions->sum('score');
        $earned = $answers->sum(fn($a) => (float) $a->score);
        $pending = $answers->whereNull('graded_at')->count();
        $scale = $result->exam->total_score ?: 100;

        $result->update([
            'score'            => $maxScore > 0 ? round($earned / $maxScore * $scale, 2) : 0,
            'total_correct'    => $answers->where('is_correct', true)->count(),
            'total_wrong'      => $answers->filter(fn($a) => $a->is_correct === false && $a->answer !== null && trim($a->answer) !== '')->count(),
            'total_unanswered' => $answers->filter(fn($a) => $a->answer === null || trim($a->answer) === '')->count(),
            'status'           => $pending > 0 ? 'SUBMITTED' : 'GRADED',
            'graded_at'        => $pending > 0 ? null : ($result->graded_at ?? now()),
            'graded_by'        => $pending > 0 ? null : ($gradedBy ?? $result->graded_by),
        ]);

        return $result->refresh();
    }

    private function isPastGrace(ExamResult $result): bool {
        return $result->status === 'IN_PROGRESS'
            && $result->expires_at
            && now()->greaterThan($result->expires_at->copy()->addSeconds(self::GRACE_SECONDS));
    }

    private function availableItem(Exam $exam, string $mode, ?ExamResult $result, array $extra): array {
        return array_merge([
            'exam_id'         => $exam->id,
            'title'           => $exam->title,
            'description'     => $exam->description,
            'subject_name'    => $exam->subject->name ?? '-',
            'duration'        => $exam->duration,
            'total_questions' => $exam->activeQuestions()->count(),
            'mode'            => $mode,
            'result_id'       => $result?->id,
            'expires_at'      => $result?->expires_at,
        ], $extra);
    }
}
