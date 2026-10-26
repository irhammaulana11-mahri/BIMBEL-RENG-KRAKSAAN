<?php

namespace App\Http\Requests\Exam;

use Illuminate\Foundation\Http\FormRequest;

class ExamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'subject_id'  => ['required', 'exists:master.subjects,id'],
            'tutor_id'    => ['required', 'exists:master.tentors,id'], // Sesuaikan table master tentor Anda
            'title'       => ['required', 'string', 'max:200'],
            'exam_date'   => ['nullable', 'date'],
            'duration'    => ['nullable', 'integer', 'min:1'],
            'total_score' => ['nullable', 'integer', 'min:1'],
        ];
    }
}