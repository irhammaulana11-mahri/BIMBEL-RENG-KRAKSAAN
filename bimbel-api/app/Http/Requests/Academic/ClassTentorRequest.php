<?php

namespace App\Http\Requests\Academic;

use App\Models\Admin\Subject;
use App\Models\Admin\Tentor;
use App\Models\Admin\TentorSubject;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ClassTentorRequest extends FormRequest
{
    public function authorize(): bool {
        return true;
    }

    public function rules(): array {
        return [
            'assignments'              => ['required', 'array', 'min:1'],
            'assignments.*.subject_id' => ['required', 'uuid', Rule::exists(Subject::class, 'id')],
            'assignments.*.tentor_id'  => ['nullable', 'uuid', Rule::exists(Tentor::class, 'id')],
        ];
    }

    public function withValidator($validator): void {
        $validator->after(function ($validator) {
            foreach ($this->input('assignments', []) as $index => $item) {
                if (!empty($item['tentor_id']) && !empty($item['subject_id'])) {
                    $hasCompetency = TentorSubject::where('tentor_id', $item['tentor_id'])
                        ->where('subject_id', $item['subject_id'])
                        ->exists();

                    if (!$hasCompetency) {
                        $validator->errors()->add(
                            "assignments.{$index}.tentor_id",
                            "Tentor tidak terdaftar menguasai mata pelajaran ini."
                        );
                    }
                }
            }
        });
    }
}