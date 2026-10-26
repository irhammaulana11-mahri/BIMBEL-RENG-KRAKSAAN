<?php

namespace App\Http\Resources\Exam;

use App\Support\LocalTime;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Ringkasan hasil ujian (list). Nilai disembunyikan dari siswa sampai GRADED.
 */
class ExamResultResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $hideScore = ($this->additional['hide_ungraded'] ?? false) && $this->status !== 'GRADED';
        $activity = $this->relationLoaded('sessionActivity') ? $this->sessionActivity : null;

        return [
            'id'                  => $this->id,
            'exam_id'             => $this->exam_id,
            'exam_title'          => $this->whenLoaded('exam', fn() => $this->exam->title),
            'subject_name'        => $this->whenLoaded('exam', fn() => $this->exam->relationLoaded('subject') ? ($this->exam->subject->name ?? '-') : null),
            'total_score'         => $this->whenLoaded('exam', fn() => $this->exam->total_score ?? 100),
            'student_id'          => $this->student_id,
            'student_name'        => $this->whenLoaded('student', fn() => $this->student->full_name ?? '-'),
            'student_nis'         => $this->whenLoaded('student', fn() => $this->student->nis ?? '-'),
            'session_activity_id' => $this->session_activity_id,
            'mode'                => $this->session_activity_id ? 'SESSION' : 'SCHEDULED',
            'class_name'          => $activity?->session?->schedule?->classroom?->name,
            'session_date'        => $activity?->session?->session_date,
            'status'              => $this->status,
            'score'               => $hideScore ? null : (float) $this->score,
            'total_correct'       => $hideScore ? null : $this->total_correct,
            'total_wrong'         => $hideScore ? null : $this->total_wrong,
            'total_unanswered'    => $hideScore ? null : $this->total_unanswered,
            'started_at'          => LocalTime::format($this->started_at, 'Y-m-d H:i'),
            'submitted_at'        => LocalTime::format($this->submitted_at, 'Y-m-d H:i'),
            'graded_at'           => LocalTime::format($this->graded_at, 'Y-m-d H:i'),
            'duration_seconds'    => $this->duration_seconds,
            'feedback'            => $hideScore ? null : $this->feedback,
        ];
    }
}
