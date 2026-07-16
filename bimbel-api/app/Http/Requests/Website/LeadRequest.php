<?php

namespace App\Http\Requests\Website;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class LeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'parent_name' => ['required', 'string', 'max:150'],
            'phone' => ['required', 'string', 'max:20'],
            'student_name' => ['required', 'string', 'max:150'],
            'education_level' => ['required', 'string', 'max:50'],
            'package_id' => ['nullable', 'uuid'],
            'notes' => ['nullable', 'string'],

            'status' => [
                'nullable',
                Rule::in([
                    'NEW',
                    'CONTACTED',
                    'REGISTERED',
                    'REJECTED'
                ])
            ]
        ];
    }
}