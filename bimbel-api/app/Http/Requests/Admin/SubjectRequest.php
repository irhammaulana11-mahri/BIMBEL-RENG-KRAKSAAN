<?php

namespace App\Http\Requests\Admin;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Admin\Subject;

class SubjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $subject = $this->route('subject');
        $subjectId = $subject?->id;
        
        return [
            'code' => ['required','string','max:20',
                Rule::unique(Subject::class, 'code')
                    ->ignore($subjectId)
            ],
            'name' => ['required','string','max:100'],
            'education_level' => ['required','string','max:30'],
            'description' => ['nullable','string'],
            'is_active' => ['boolean']
        ];
    }
}