<?php

namespace App\Http\Resources\Exam;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Soal untuk siswa yang sedang mengerjakan: TANPA kunci jawaban.
 */
class StudentQuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'            => $this->id,
            'question_type' => $this->question_type,
            'question'      => $this->question,
            'options'       => collect($this->options())
                                ->map(fn($text, $key) => ['key' => (string) $key, 'text' => $text])
                                ->values(),
            'score'         => $this->score,
            'order_no'      => $this->order_no,
        ];
    }
}
