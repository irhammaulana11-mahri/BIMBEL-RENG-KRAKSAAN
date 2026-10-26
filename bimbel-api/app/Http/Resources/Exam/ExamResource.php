<?php

namespace App\Http\Resources\Exam;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExamResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'subject_id'   => $this->subject_id,
            'subject_name' => $this->whenLoaded('subject', fn() => $this->subject->name),
            'tutor_id'     => $this->tutor_id,
            'tutor_name'   => $this->whenLoaded('tentor', fn() => $this->tentor->user->name ?? $this->tentor->name ?? 'Tentor'),
            'title'        => $this->title,
            'exam_date'    => $this->exam_date?->format('Y-m-d'),
            'duration'     => $this->duration,
            'total_score'  => $this->total_score ?? 100,
            'created_at'   => $this->created_at,
            'updated_at'   => $this->updated_at,
        ];
    }
}