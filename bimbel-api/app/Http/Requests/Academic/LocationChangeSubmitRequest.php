<?php

namespace App\Http\Requests\Academic;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Pengajuan lokasi les sementara (tentor & orang tua).
 */
class LocationChangeSubmitRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id'    => ['nullable', 'uuid'],
            'location_name' => ['required', 'string', 'max:150'],
            'address'       => ['required', 'string', 'max:500'],
            'latitude'      => ['required', 'numeric', 'between:-90,90'],
            'longitude'     => ['required', 'numeric', 'between:-180,180'],
            'reason'        => ['required', 'string', 'min:5', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'location_name.required' => 'Nama tempat wajib diisi.',
            'address.required'       => 'Alamat wajib diisi.',
            'latitude.required'      => 'Titik lokasi wajib dipilih di peta atau diambil dari GPS.',
            'longitude.required'     => 'Titik lokasi wajib dipilih di peta atau diambil dari GPS.',
            'reason.required'        => 'Alasan wajib diisi.',
            'reason.min'             => 'Alasan minimal 5 karakter.',
        ];
    }
}
