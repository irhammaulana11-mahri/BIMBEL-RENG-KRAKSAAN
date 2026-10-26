<?php

namespace App\Http\Requests\Exam;

use App\Models\Academic\ClassRoom;
use App\Models\Admin\Subject;
use App\Models\Admin\Tentor;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ExamRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        // Jadwal dianggap kosong jika salah satu tidak diisi
        if (!$this->filled('opens_at') || !$this->filled('closes_at')) {
            $this->merge(['opens_at' => null, 'closes_at' => null]);
        }
    }

    public function rules(): array
    {
        return [
            'subject_id'  => ['required', 'uuid', Rule::exists(Subject::class, 'id')],
            'tutor_id'    => ['nullable', 'uuid', Rule::exists(Tentor::class, 'id')],
            'title'       => ['required', 'string', 'max:200'],
            'description' => ['nullable', 'string'],
            'exam_date'   => ['nullable', 'date'],
            'duration'    => ['required', 'integer', 'min:1', 'max:600'],
            'total_score' => ['nullable', 'integer', 'min:1', 'max:1000'],

            // Ujian terjadwal (opsional) - waktu dalam WIB
            'opens_at'    => ['nullable', 'date'],
            'closes_at'   => ['nullable', 'date', 'after:opens_at'],
            'class_ids'   => ['nullable', 'array', 'required_with:opens_at'],
            'class_ids.*' => ['uuid', 'distinct', Rule::exists(ClassRoom::class, 'id')],
        ];
    }

    public function messages(): array
    {
        return [
            'duration.required'       => 'Durasi ujian wajib diisi.',
            'closes_at.after'         => 'Waktu tutup harus setelah waktu buka.',
            'class_ids.required_with' => 'Pilih minimal satu kelas peserta untuk ujian terjadwal.',
        ];
    }
}
