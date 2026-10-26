<?php

namespace App\Http\Requests\Academic;

use App\Models\Admin\Student;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ClassStudentRequest extends FormRequest
{
    public function authorize(): bool {
        return true;
    }

    public function rules(): array {
        return [
            'student_ids'   => ['nullable', 'array'],
            'student_ids.*' => ['uuid', Rule::exists(Student::class, 'id')],
        ];
    }

    public function messages(): array {
        return [
            'student_ids.array'    => 'Format data siswa tidak valid.',
            'student_ids.*.exists' => 'Salah satu siswa tidak ditemukan di database.',
        ];
    }
}