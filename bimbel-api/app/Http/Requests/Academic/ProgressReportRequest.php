<?php

namespace App\Http\Requests\Academic;

use App\Models\Academic\ClassRoom;
use App\Models\Admin\Student;
use App\Models\Admin\Subject;
use App\Services\Academic\ProgressReportService;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validasi rapor untuk Admin, tentor, orang tua, dan siswa (berdasar method controller).
 */
class ProgressReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $period = ['required', 'date_format:Y-m'];
        $class = ['required', 'uuid', Rule::exists(ClassRoom::class, 'id')];
        $student = ['required', 'uuid', Rule::exists(Student::class, 'id')];
        $semester = [
            'academic_year' => ['required', 'integer', 'between:2000,2100'],
            'term'          => ['required', Rule::in(ProgressReportService::TERMS)],
        ];

        return match ($this->route()->getActionMethod()) {
            'index' => [
                'period'   => $period,
                'class_id' => ['nullable', 'uuid'],
                'keyword'  => ['nullable', 'string', 'max:100'],
                'status'   => ['nullable', 'in:DRAFT,PUBLISHED,draft,published'],
            ],
            'show' => [
                'period'     => $period,
                'class_id'   => $class,
                'student_id' => $student,
            ],
            'saveGeneralNote' => [
                'period'       => $period,
                'class_id'     => $class,
                'student_id'   => $student,
                'general_note' => ['nullable', 'string', 'max:2000'],
            ],
            'publish' => [
                'period'        => $period,
                'class_id'      => $class,
                'student_ids'   => ['nullable', 'array'],
                'student_ids.*' => ['uuid', 'distinct'],
            ],
            'semester' => $semester + [
                'class_id'   => ['nullable', 'uuid'],
                'keyword'    => ['nullable', 'string', 'max:100'],
                'student_id' => ['nullable', 'uuid'],
            ],
            'semesterShow' => $semester + [
                'class_id'   => $class,
                // Siswa hanya melihat rapornya sendiri, tidak mengirim student_id
                'student_id' => $this->is('api/student/*') ? ['prohibited'] : $student,
            ],
            // Tentor
            'notes' => ['period' => $period],
            'saveNotes' => [
                'period'             => $period,
                'class_id'           => $class,
                'subject_id'         => ['required', 'uuid', Rule::exists(Subject::class, 'id')],
                'notes'              => ['required', 'array', 'min:1'],
                'notes.*.student_id' => ['required', 'uuid', 'distinct'],
                'notes.*.note'       => ['nullable', 'string', 'max:2000'],
            ],
            default => [],
        };
    }

    public function messages(): array
    {
        return [
            'period.required'      => 'Periode rapor wajib diisi.',
            'period.date_format'   => 'Format periode harus YYYY-MM.',
            'class_id.required'    => 'Kelas wajib dipilih.',
            'student_id.required'  => 'Siswa wajib dipilih.',
            'notes.required'       => 'Tidak ada catatan yang dikirim.',
            'notes.*.note.max'     => 'Catatan maksimal 2000 karakter.',
            'general_note.max'     => 'Catatan umum maksimal 2000 karakter.',
        ];
    }

    public function period(): array
    {
        return ProgressReportService::parsePeriod($this->input('period'));
    }
}
