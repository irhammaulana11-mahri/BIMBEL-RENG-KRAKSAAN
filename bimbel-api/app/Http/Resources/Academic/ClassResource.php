<?php

namespace App\Http\Resources\Academic;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'id'                   => $this->id,
            'code'                 => $this->code,
            'name'                 => $this->name,
            'class_type'           => strtoupper($this->class_type),
            'education_level'      => $this->education_level,
            'education_level_id'   => $this->education_level_id,
            'package_id'           => $this->package_id,
            'package_name'         => $this->whenLoaded('package', fn() => $this->package->package_name),
            'package_price'        => $this->whenLoaded('package', fn() => (float) $this->package->default_price),
            'meeting_per_month'    => $this->meeting_per_month,
            'duration_minutes'     => $this->duration_minutes,
            'learning_location_id' => $this->learning_location_id,
            'display_name'         => $this->whenLoaded('educationLevel', fn() => $this->educationLevel->display_name) 
                                      ?? $this->educationLevel?->display_name 
                                      ?? $this->education_level,
            'location_name'        => $this->whenLoaded('location', fn() => $this->location->location_name),
            'max_students'         => $this->max_students,
            'description'          => $this->description,
            'is_active'            => $this->is_active,
            'status'               => $this->status,
            'subject_count'        => $this->classSubjects()->count(),
            'tentor_count'         => $this->classSubjects()->whereNotNull('tentor_id')->count(),
            'students_count'       => $this->students_count ?? $this->classStudents()->count(),
            'schedules_count'      => $this->schedules_count ?? $this->schedules()->count(),

            // List Relasi Kontrak Mengajar Class Subjects
            'class_subjects'       => $this->whenLoaded('classSubjects', function () {
                return $this->classSubjects->map(function ($cs) {
                    return [
                        'id'                 => $cs->id,
                        'subject_id'         => $cs->subject_id,
                        'package_subject_id' => $cs->package_subject_id,
                        'subject_name'       => $cs->subject?->name,
                        'subject_code'       => $cs->subject?->code,
                        'tentor_id'          => $cs->tentor_id,
                        'tentor_name'        => $cs->tentor?->name ?? $cs->tentor?->user?->name,
                        'specialization'     => $cs->tentor?->specialization,
                        'meeting_target'     => $cs->meeting_target,
                        'display_order'      => $cs->display_order,
                        'status'             => $cs->status,
                    ];
                });
            }),

            // List Siswa Terikat
            'students'             => $this->whenLoaded('students', function () {
                return $this->students->map(fn($st) => [
                    'id'            => $st->id,
                    'student_id'    => $st->id,
                    'name'          => $st->full_name ?? $st->user?->name ?? 'Siswa',
                    'full_name'     => $st->full_name ?? $st->user?->name ?? 'Siswa',
                    'nis'           => $st->nis ?? 'STD-',
                    'grade'         => $st->grade ?? $st->education_level ?? '-',
                    'school'        => $st->school_name ?? '-',
                    'parent_name'   => $st->parent?->first()?->full_name ?? '-',
                    'address'       => $st->parent?->first()?->address ?? $st->address ?? '-',
                ]);
            }),

            'created_at'           => $this->created_at?->format('Y-m-d H:i:s'),
        ];
    }
}