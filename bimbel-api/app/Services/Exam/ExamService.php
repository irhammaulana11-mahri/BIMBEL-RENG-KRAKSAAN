<?php
namespace App\Services\Exam;

use App\Models\Exam\Exam;
use App\Models\Exam\Question;
use App\Support\LocalTime;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Pengelolaan exam dan bank soal (Admin).
 * Soal dikunci setelah ada siswa yang mengerjakan agar nilai tetap konsisten.
 */
class ExamService {

    public function create(array $data): Exam {
        return DB::transaction(function () use ($data) {
            $exam = Exam::create(array_merge($this->examAttributes($data), [
                'status'     => 'DRAFT',
                'created_by' => Auth::id(),
            ]));

            $exam->classes()->sync($data['class_ids'] ?? []);

            return $exam;
        });
    }

    public function update(Exam $exam, array $data): Exam {
        if ($this->hasResults($exam)) {
            $locked = ['subject_id', 'total_score', 'duration'];
            foreach ($locked as $field) {
                if (array_key_exists($field, $data) && (string) $data[$field] !== (string) $exam->{$field}) {
                    throw ValidationException::withMessages([$field => ['Mapel, durasi, dan total nilai tidak dapat diubah karena sudah ada siswa yang mengerjakan.']]);
                }
            }
        }

        return DB::transaction(function () use ($exam, $data) {
            $exam->update($this->examAttributes($data));

            if (array_key_exists('class_ids', $data)) {
                $exam->classes()->sync($data['class_ids'] ?? []);
            }

            return $exam->refresh();
        });
    }

    public function changeStatus(Exam $exam, string $status): Exam {
        if ($status === 'PUBLISHED') {
            if ($exam->activeQuestions()->count() === 0) {
                throw ValidationException::withMessages(['status' => ['Tambahkan minimal satu soal aktif sebelum menerbitkan ujian.']]);
            }
            if (!$exam->duration) {
                throw ValidationException::withMessages(['status' => ['Durasi ujian wajib diisi sebelum diterbitkan.']]);
            }
        }

        if ($status === 'DRAFT' && $this->hasResults($exam)) {
            throw ValidationException::withMessages(['status' => ['Ujian yang sudah dikerjakan siswa tidak dapat dikembalikan ke draft. Arsipkan saja.']]);
        }

        $exam->update(['status' => $status]);

        return $exam->refresh();
    }

    public function delete(Exam $exam): void {
        if ($this->hasResults($exam)) {
            throw ValidationException::withMessages(['exam' => ['Ujian yang sudah dikerjakan siswa tidak dapat dihapus. Arsipkan saja.']]);
        }

        if ($exam->sessionActivities()->exists()) {
            throw ValidationException::withMessages(['exam' => ['Ujian masih dipakai pada aktivitas sesi KBM.']]);
        }

        $exam->delete();
    }

    /*
    |--------------------------------------------------------------------------
    | QUESTIONS
    |--------------------------------------------------------------------------
    */

    public function createQuestion(Exam $exam, array $data): Question {
        $this->ensureQuestionsEditable($exam);

        return DB::transaction(function () use ($exam, $data) {
            // Kunci baris exam agar order_no tidak bentrok (unique exam_id + order_no)
            Exam::whereKey($exam->id)->lockForUpdate()->first();
            $lastOrder = Question::where('exam_id', $exam->id)->max('order_no') ?? 0;

            return Question::create(array_merge($this->questionAttributes($data), [
                'exam_id'  => $exam->id,
                'order_no' => $lastOrder + 1,
            ]));
        });
    }

    public function updateQuestion(Question $question, array $data): Question {
        $this->ensureQuestionsEditable($question->exam);

        $question->update($this->questionAttributes($data));

        return $question->refresh();
    }

    public function deleteQuestion(Question $question): void {
        $exam = $question->exam;
        $this->ensureQuestionsEditable($exam);

        DB::transaction(function () use ($question, $exam) {
            $question->delete();
            $this->reorderQuestions($exam, Question::where('exam_id', $exam->id)->orderBy('order_no')->pluck('id')->all(), false);
        });
    }

    public function reorderQuestions(Exam $exam, array $orderedIds, bool $validate = true): void {
        if ($validate) {
            $this->ensureQuestionsEditable($exam);

            $currentIds = Question::where('exam_id', $exam->id)->pluck('id');
            if ($currentIds->count() !== count($orderedIds) || $currentIds->diff($orderedIds)->isNotEmpty()) {
                throw ValidationException::withMessages(['question_ids' => ['Daftar soal tidak sesuai dengan soal pada ujian ini.']]);
            }
        }

        DB::transaction(function () use ($exam, $orderedIds) {
            // Geser sementara ke angka negatif agar tidak melanggar unique (exam_id, order_no)
            Question::where('exam_id', $exam->id)->update(['order_no' => DB::raw('-order_no')]);
            foreach (array_values($orderedIds) as $index => $id) {
                Question::whereKey($id)->update(['order_no' => $index + 1]);
            }
        });
    }

    public function hasResults(Exam $exam): bool {
        return $exam->results()->exists();
    }

    private function ensureQuestionsEditable(Exam $exam): void {
        if ($this->hasResults($exam)) {
            throw ValidationException::withMessages(['question' => ['Soal tidak dapat diubah karena sudah ada siswa yang mengerjakan ujian ini.']]);
        }
    }

    private function examAttributes(array $data): array {
        $attributes = collect($data)
            ->only(['subject_id', 'tutor_id', 'title', 'description', 'exam_date', 'duration', 'total_score'])
            ->all();

        // Jadwal buka-tutup diinput dalam WIB
        if (array_key_exists('opens_at', $data)) $attributes['opens_at'] = LocalTime::parse($data['opens_at']);
        if (array_key_exists('closes_at', $data)) $attributes['closes_at'] = LocalTime::parse($data['closes_at']);

        return $attributes;
    }

    private function questionAttributes(array $data): array {
        $type = $data['question_type'];
        $attributes = [
            'question_type'  => $type,
            'question'       => $data['question'],
            'score'          => $data['score'] ?? 1,
            'is_active'      => $data['is_active'] ?? true,
            'essay_answer'   => $data['essay_answer'] ?? null,
            'correct_answer' => null,
        ];

        foreach (Question::OPTION_KEYS as $key) {
            $field = 'option_' . strtolower($key);
            $attributes[$field] = $type === 'MULTIPLE_CHOICE' ? ($data[$field] ?? null) : null;
        }

        if ($type === 'MULTIPLE_CHOICE' || $type === 'TRUE_FALSE') {
            $attributes['correct_answer'] = strtoupper($data['correct_answer']);
        } elseif ($type === 'SHORT_ANSWER') {
            $attributes['correct_answer'] = trim($data['correct_answer']);
        }

        return $attributes;
    }
}
