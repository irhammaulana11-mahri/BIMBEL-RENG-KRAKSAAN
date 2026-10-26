<?php

namespace App\Http\Resources\Exam;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Soal lengkap dengan kunci jawaban. Hanya untuk Admin / Tentor.
 * Untuk siswa gunakan StudentQuestionResource.
 */
class QuestionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'exam_id'        => $this->exam_id,
            'question_type'  => $this->question_type,
            'question'       => $this->question,
            'option_a'       => $this->option_a,
            'option_b'       => $this->option_b,
            'option_c'       => $this->option_c,
            'option_d'       => $this->option_d,
            'option_e'       => $this->option_e,
            'correct_answer' => $this->correct_answer,
            'essay_answer'   => $this->essay_answer,
            'score'          => $this->score,
            'order_no'       => $this->order_no,
            'is_active'      => $this->is_active,
        ];
    }
}
