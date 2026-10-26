<?php

namespace App\Http\Requests\Academic;

use App\Models\Admin\Subject;
use App\Models\Admin\Tentor;
use App\Models\Admin\TentorSubject;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ClassSubjectRequest extends FormRequest
{
    public function authorize(): bool {
        return true;
    }

    public function rules(): array {
        return [
            'subjects'                      => ['required', 'array', 'min:1'],
            'subjects.*.subject_id'         => ['required', 'uuid', Rule::exists(Subject::class, 'id')],
            'subjects.*.package_subject_id' => ['nullable', 'uuid'],
            'subjects.*.tentor_id'          => ['nullable', 'uuid', Rule::exists(Tentor::class, 'id')],
            'subjects.*.meeting_target'     => ['nullable', 'integer', 'min:0'],
            'subjects.*.display_order'      => ['nullable', 'integer'],
        ];
    }

    public function withValidator($validator): void {
        $validator->after(function ($validator) {
            foreach ($this->input('subjects', []) as $index => $subject) {
                if (!empty($subject['tentor_id']) && !empty($subject['subject_id'])) {
                    $hasCompetency = TentorSubject::where('tentor_id', $subject['tentor_id'])
                        ->where('subject_id', $subject['subject_id'])
                        ->exists();

                    if (!$hasCompetency) {
                        $validator->errors()->add(
                            "subjects.{$index}.tentor_id",
                            "Tentor yang dipilih tidak memiliki kualifikasi/kompetensi untuk mengampu mata pelajaran ini."
                        );
                    }
                }
            }
        });
    }

    public function messages(): array {
        return [
            'subjects.required'          => 'Minimal pilih satu mata pelajaran.',
            'subjects.*.subject_id.required' => 'ID mata pelajaran wajib diisi.',
            'subjects.*.subject_id.exists'   => 'Mata pelajaran tidak ditemukan.',
        ];
    }
}