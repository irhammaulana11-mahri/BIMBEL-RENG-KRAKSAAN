<?php

namespace App\Http\Requests\Academic;

use App\Models\Admin\Student;
use Illuminate\Validation\Rule;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ClassStudentRequest extends FormRequest
{

    public function authorize(): bool {
        return true;
    }

    public function rules(): array {
        return [
            'student_ids' => ['required','array','min:1'],
            'student_ids.*' => ['uuid',Rule::exists(Student::class,'id')],
        ];
    }

    public function messages(): array {
        return [
            'student_ids.required' => 'Minimal pilih satu siswa.',
            'student_ids.array' => 'Format data siswa tidak valid.',
            'student_ids.*.uuid' => 'ID siswa tidak valid.',
            'student_ids.*.exists' => 'Siswa tidak ditemukan.',
        ];
    }
}