<?php

namespace App\Http\Requests\Exam;

use Illuminate\Foundation\Http\FormRequest;

class GradeExamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'grades'             => ['present', 'array'],
            'grades.*.answer_id' => ['required', 'uuid', 'distinct'],
            'grades.*.score'     => ['required', 'numeric', 'min:0'],
            'grades.*.feedback'  => ['nullable', 'string', 'max:1000'],
            'feedback'           => ['nullable', 'string', 'max:2000'],
        ];
    }
}
