<?php

namespace App\Http\Requests\Academic;

use App\Models\Admin\Subject;
use App\Models\Admin\EducationLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;


class CurriculumRequest extends FormRequest {
    public function authorize(): bool {
        return true;
    }

    public function rules(): array {
        return [
            'subject_id'         => ['required', Rule::exists(Subject::class, 'id')],
            'title'              => ['required', 'string', 'max:200'],
            'description'        => ['nullable', 'string'],
            'education_level'    => ['nullable', 'string', 'max:20'],
            'education_level_id' => ['nullable', Rule::exists(EducationLevel::class, 'id')],
            'semester'           => ['nullable', 'integer', 'min:1', 'max:8'],
            'order_no'           => ['required', 'integer'],
            'is_active'          => ['boolean'],
        ];
    }
}