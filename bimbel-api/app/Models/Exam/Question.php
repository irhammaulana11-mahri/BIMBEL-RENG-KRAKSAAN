<?php

namespace App\Models\Exam;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Question extends Model
{
    use HasUuids;

    protected $table = 'exam.questions';

    public const TYPES = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY'];

    // Jenis soal yang dinilai otomatis saat siswa submit
    public const AUTO_GRADED_TYPES = ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'];

    public const OPTION_KEYS = ['A', 'B', 'C', 'D', 'E'];

    protected $fillable = [
        'exam_id',
        'question_type',
        'question',
        'option_a',
        'option_b',
        'option_c',
        'option_d',
        'option_e',
        'correct_answer',
        'essay_answer',
        'score',
        'order_no',
        'is_active',
    ];

    protected $casts = [
        'score'     => 'integer',
        'order_no'  => 'integer',
        'is_active' => 'boolean',
    ];

    public function exam()
    {
        return $this->belongsTo(Exam::class, 'exam_id');
    }

    public function isAutoGraded(): bool
    {
        return in_array($this->question_type, self::AUTO_GRADED_TYPES);
    }

    /**
     * Pilihan jawaban yang terisi, contoh: ['A' => 'teks', 'B' => 'teks'].
     */
    public function options(): array
    {
        if ($this->question_type === 'TRUE_FALSE') {
            return ['TRUE' => 'Benar', 'FALSE' => 'Salah'];
        }

        if ($this->question_type !== 'MULTIPLE_CHOICE') {
            return [];
        }

        return collect(self::OPTION_KEYS)
            ->mapWithKeys(fn($key) => [$key => $this->{'option_' . strtolower($key)}])
            ->filter(fn($text) => $text !== null && $text !== '')
            ->all();
    }

    /**
     * Cek jawaban otomatis. Null untuk essay (dinilai tentor).
     * SHORT_ANSWER: beberapa kunci dipisah "|" dan dibandingkan tanpa beda huruf besar/kecil.
     */
    public function checkAnswer(?string $answer): ?bool
    {
        if (!$this->isAutoGraded()) return null;
        if ($answer === null || trim($answer) === '') return false;

        $normalize = fn($value) => mb_strtolower(preg_replace('/\s+/', ' ', trim((string) $value)));

        if ($this->question_type === 'SHORT_ANSWER') {
            $keys = array_map($normalize, explode('|', (string) $this->correct_answer));
            return in_array($normalize($answer), $keys, true);
        }

        return strtoupper(trim($answer)) === strtoupper(trim((string) $this->correct_answer));
    }
}
