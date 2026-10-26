<?php

namespace App\Http\Requests\Academic;

use Illuminate\Foundation\Http\FormRequest;

class TentorAttendanceRequest extends FormRequest {
    public function authorize(): bool {
        return true;
    }

    public function rules(): array {
        return [
            'attendance_status' => ['required', 'in:HADIR,IZIN,SAKIT,ALPA'],
            'checkin_time'      => ['nullable', 'required_if:attendance_status,HADIR', 'date_format:H:i'],
            'checkout_time'     => ['nullable', 'date_format:H:i', 'after:checkin_time'],
            'note'              => ['nullable', 'string', 'max:255'],
        ];
    }

    public function messages(): array {
        return [
            'checkin_time.required_if' => 'Jam masuk wajib diisi untuk status HADIR.',
            'checkout_time.after'      => 'Jam keluar harus lebih besar dari jam masuk.',
        ];
    }
}
