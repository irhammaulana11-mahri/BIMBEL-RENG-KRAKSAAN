<?php

namespace App\Http\Requests\Exam;

use App\Models\Exam\Question;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class QuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'question_type'  => strtoupper((string) $this->question_type),
            'correct_answer' => is_string($this->correct_answer) ? trim($this->correct_answer) : $this->correct_answer,
        ]);
    }

    public function rules(): array
    {
        $type = $this->input('question_type');

        $rules = [
            'question_type' => ['required', Rule::in(Question::TYPES)],
            'question'      => ['required', 'string'],
            'score'         => ['required', 'integer', 'min:1', 'max:100'],
            'is_active'     => ['nullable', 'boolean'],
            'essay_answer'  => ['nullable', 'string'],
            'option_a'      => ['nullable', 'string'],
            'option_b'      => ['nullable', 'string'],
            'option_c'      => ['nullable', 'string'],
            'option_d'      => ['nullable', 'string'],
            'option_e'      => ['nullable', 'string'],
        ];

        if ($type === 'MULTIPLE_CHOICE') {
            $rules['option_a'] = ['required', 'string'];
            $rules['option_b'] = ['required', 'string'];
            $rules['correct_answer'] = [
                'required',
                Rule::in(['A', 'B', 'C', 'D', 'E', 'a', 'b', 'c', 'd', 'e']),
                function ($attribute, $value, $fail) {
                    if (!$this->filled('option_' . strtolower($value))) {
                        $fail('Kunci jawaban harus mengarah ke pilihan yang terisi.');
                    }
                },
            ];
        } elseif ($type === 'TRUE_FALSE') {
            $rules['correct_answer'] = ['required', Rule::in(['TRUE', 'FALSE', 'true', 'false'])];
        } elseif ($type === 'SHORT_ANSWER') {
            $rules['correct_answer'] = ['required', 'string', 'max:500'];
        } else {
            $rules['correct_answer'] = ['nullable'];
        }

        return $rules;
    }

    public function messages(): array
    {
        return [
            'option_a.required'       => 'Pilihan A wajib diisi.',
            'option_b.required'       => 'Pilihan B wajib diisi.',
            'correct_answer.required' => 'Kunci jawaban wajib diisi.',
        ];
    }
}
