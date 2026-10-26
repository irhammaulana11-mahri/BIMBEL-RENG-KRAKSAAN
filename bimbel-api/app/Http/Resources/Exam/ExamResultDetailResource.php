<?php

namespace App\Http\Resources\Exam;

use App\Models\Exam\Question;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Detail hasil ujian beserta jawaban per soal.
 *
 * additional:
 * - for_student (bool): kunci & nilai hanya tampil jika status GRADED
 */
class ExamResultDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $forStudent = $this->additional['for_student'] ?? false;
        $showReview = !$forStudent || $this->status === 'GRADED';

        $questions = Question::where('exam_id', $this->exam_id)->where('is_active', true)->orderBy('order_no')->get();
        $answers = $this->answers->keyBy('question_id');

        $summary = (new ExamResultResource($this->resource))
            ->additional(['hide_ungraded' => $forStudent])
            ->toArray($request);

        return array_merge($summary, [
            'show_review' => $showReview,
            'answers'     => $questions->map(function ($question) use ($answers, $showReview) {
                $answer = $answers->get($question->id);

                $item = [
                    'answer_id'     => $answer?->id,
                    'question_id'   => $question->id,
                    'order_no'      => $question->order_no,
                    'question_type' => $question->question_type,
                    'question'      => $question->question,
                    'options'       => collect($question->options())
                                        ->map(fn($text, $key) => ['key' => (string) $key, 'text' => $text])
                                        ->values(),
                    'max_score'     => $question->score,
                    'answer'        => $answer?->answer,
                    'needs_grading' => $answer !== null && $answer->graded_at === null,
                ];

                if ($showReview) {
                    $item += [
                        'correct_answer'   => $question->correct_answer,
                        'essay_answer'     => $question->essay_answer,
                        'is_correct'       => $answer?->is_correct,
                        'score'            => $answer ? (float) $answer->score : 0,
                        'teacher_feedback' => $answer?->teacher_feedback,
                    ];
                }

                return $item;
            })->values(),
        ]);
    }
}
