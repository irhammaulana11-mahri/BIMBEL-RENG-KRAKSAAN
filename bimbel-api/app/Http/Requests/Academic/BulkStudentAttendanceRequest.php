<?php

namespace App\Http\Requests\Academic;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;


class BulkStudentAttendanceRequest extends FormRequest {
    public function authorize(): bool {
        return true;
    }

    public function rules(): array {
        return [
            'attendances'                     => ['required', 'array'],
            'attendances.*.student_id'        => ['required', 'uuid', 'distinct'],
            // BELUM = hapus record absensi siswa tersebut
            'attendances.*.attendance_status' => ['required', 'in:HADIR,IZIN,SAKIT,ALPA,BELUM'],
            'attendances.*.note'              => ['nullable', 'string', 'max:255'],
        ];
    }
}
