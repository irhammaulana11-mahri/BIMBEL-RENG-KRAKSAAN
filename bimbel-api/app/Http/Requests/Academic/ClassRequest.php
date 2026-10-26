<?php

namespace App\Http\Requests\Academic;

use App\Models\Academic\ClassRoom;
use App\Models\Website\Package;
use App\Models\Academic\LearningLocation;
use App\Models\Admin\Subject;
use App\Models\Admin\Student;
use App\Models\Admin\Tentor;
use App\Models\Admin\EducationLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ClassRequest extends FormRequest
{
    public function authorize(): bool {
        return true;
    }

    protected function prepareForValidation(): void {
        $this->merge([
            'class_type'      => $this->filled('class_type') ? strtoupper(trim($this->class_type)) : 'REGULER',
            'education_level' => $this->filled('education_level') ? strtoupper(trim($this->education_level)) : null,
            'status'          => $this->filled('status') ? strtoupper(trim($this->status)) : 'ON_PROGRESS',
        ]);
    }

    public function rules(): array {
        $classId = $this->route('class')?->id;

        return [
            'code'               => ['required', 'string', 'max:20', Rule::unique(ClassRoom::class, 'code')->ignore($classId)],
            'name'               => ['required', 'string', 'max:150'],
            'class_type'         => ['required', 'string', 'max:30'],
            'education_level_id' => ['required', 'uuid', Rule::exists(EducationLevel::class, 'id')],
            'education_level'    => ['required', 'string', 'max:20'],
            'package_id'         => ['nullable', 'uuid', Rule::exists(Package::class, 'id')],
            
            'meeting_per_month'  => [
                Rule::requiredIf(fn() => !$this->filled('package_id')),
                'nullable', 'integer', 'min:1', 'max:31'
            ],
            'duration_minutes'   => [
                Rule::requiredIf(fn() => !$this->filled('package_id')),
                'nullable', 'integer', 'min:1', 'max:480'
            ],
            
            'learning_location_id' => ['nullable', 'uuid', Rule::exists(LearningLocation::class, 'id')],
            'max_students'         => ['required', 'integer', 'min:1', 'max:100'],
            'description'          => ['nullable', 'string'],
            'is_active'            => ['required', 'boolean'],
            'status'               => ['nullable', 'string', Rule::in(['DRAFT', 'ACTIVE', 'ON_PROGRESS', 'COMPLETED', 'SELESAI', 'ARCHIVED'])],

            // Array Mata Pelajaran & Plotting Tentor
            'subjects'                      => ['nullable', 'array'],
            'subjects.*.subject_id'         => ['required_with:subjects', 'uuid', Rule::exists(Subject::class, 'id')],
            'subjects.*.package_subject_id' => ['nullable', 'uuid'],
            'subjects.*.tentor_id'          => ['nullable', 'uuid', Rule::exists(Tentor::class, 'id')],
            'subjects.*.meeting_target'     => ['nullable', 'integer', 'min:0'],
            'subjects.*.display_order'      => ['nullable', 'integer'],

            // Array ID Siswa Terikat
            'student_ids'   => ['nullable', 'array'],
            'student_ids.*' => ['uuid', Rule::exists(Student::class, 'id')],
        ];
    }
}