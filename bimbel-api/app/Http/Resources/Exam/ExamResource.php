<?php

namespace App\Http\Resources\Exam;

use App\Support\LocalTime;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExamResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'subject_id'      => $this->subject_id,
            'subject_name'    => $this->whenLoaded('subject', fn() => $this->subject->name),
            'tutor_id'        => $this->tutor_id,
            'tutor_name'      => $this->whenLoaded('tentor', fn() => $this->tentor ? ($this->tentor->user->name ?? $this->tentor->name ?? 'Tentor') : null),
            'title'           => $this->title,
            'description'     => $this->description,
            'exam_date'       => $this->exam_date?->format('Y-m-d'),
            'duration'        => $this->duration,
            'total_score'     => $this->total_score ?? 100,
            'status'          => $this->status,

            // Jadwal buka-tutup dalam WIB (format input datetime-local)
            'opens_at'        => LocalTime::format($this->opens_at),
            'closes_at'       => LocalTime::format($this->closes_at),
            'is_scheduled'    => $this->opens_at !== null && $this->closes_at !== null,
            'class_ids'       => $this->whenLoaded('classes', fn() => $this->classes->pluck('id')),
            'class_names'     => $this->whenLoaded('classes', fn() => $this->classes->pluck('name')),

            'questions_count' => $this->whenCounted('activeQuestions', fn() => $this->active_questions_count),
            'results_count'   => $this->whenCounted('results', fn() => $this->results_count),
            'pending_count'   => $this->when(isset($this->pending_results_count), fn() => (int) $this->pending_results_count),
            'created_at'      => $this->created_at,
            'updated_at'      => $this->updated_at,
        ];
    }
}
