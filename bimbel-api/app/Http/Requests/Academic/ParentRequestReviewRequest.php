<?php

namespace App\Http\Requests\Academic;

use App\Models\Academic\ClassRoom;
use App\Models\Admin\Tentor;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Validasi keputusan Admin atas pengajuan pindah jadwal & pendaftaran anak.
 */
class ParentRequestReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return match ($this->route()->getActionMethod()) {
            'index' => [
                'status' => ['nullable', Rule::in(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'ALL'])],
            ],
            'approveReschedule' => [
                'session_date' => ['nullable', 'date_format:Y-m-d'],
                'start_time'   => ['nullable', 'date_format:H:i', 'required_with:end_time'],
                'end_time'     => ['nullable', 'date_format:H:i', 'required_with:start_time', 'after:start_time'],
                'tentor_id'    => ['nullable', 'uuid', Rule::exists(Tentor::class, 'id')],
                'review_note'  => ['nullable', 'string', 'max:500'],
            ],
            'approveRegistration' => [
                'class_id'    => ['nullable', 'uuid', Rule::exists(ClassRoom::class, 'id')],
                'full_name'   => ['nullable', 'string', 'max:150'],
                'school_name' => ['nullable', 'string', 'max:150'],
                'review_note' => ['nullable', 'string', 'max:500'],
                // Admin boleh mengganti email login anak; kosong = usulan orang tua / dari NIS
                'login_email' => ['nullable', 'email', 'max:100', Rule::unique(\App\Models\Admin\User::class, 'email')],
            ],
            'approveLocation' => [
                'review_note' => ['nullable', 'string', 'max:500'],
            ],
            'rejectReschedule', 'rejectRegistration', 'rejectLocation' => [
                'review_note' => ['required', 'string', 'min:3', 'max:500'],
            ],
            default => [],
        };
    }

    public function messages(): array
    {
        return [
            'review_note.required'    => 'Alasan penolakan wajib diisi.',
            'review_note.min'         => 'Alasan penolakan minimal 3 karakter.',
            'start_time.required_with' => 'Jam mulai dan jam selesai harus diisi bersamaan.',
            'end_time.required_with'  => 'Jam mulai dan jam selesai harus diisi bersamaan.',
            'end_time.after'          => 'Jam selesai harus setelah jam mulai.',
        ];
    }
}
