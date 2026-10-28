<?php

namespace App\Http\Requests\Parent;

use App\Models\Admin\EducationLevel;
use App\Models\Admin\User;
use App\Models\Website\Package;
use App\Support\LocalTime;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

/**
 * Validasi portal orang tua (berdasar method controller).
 */
class ParentPortalRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return match ($this->route()->getActionMethod()) {
            'schedules' => [
                'from'       => ['required', 'date_format:Y-m-d'],
                'to'         => ['required', 'date_format:Y-m-d', 'after_or_equal:from'],
                'student_id' => ['nullable', 'uuid'],
            ],
            'examResults' => [
                'student_id' => ['nullable', 'uuid'],
            ],
            'requestReschedule' => [
                'student_id'          => ['nullable', 'uuid'],
                'proposed_date'       => ['required', 'date_format:Y-m-d', 'after_or_equal:' . LocalTime::today()],
                'proposed_start_time' => ['required', 'date_format:H:i'],
                'reason'              => ['required', 'string', 'min:5', 'max:500'],
            ],
            'updateProfile' => [
                'phone'      => ['nullable', 'string', 'max:20', 'regex:/^[0-9+\- ]{8,20}$/', Rule::unique(User::class, 'phone')->ignore(Auth::id())],
                'occupation' => ['nullable', 'string', 'max:100'],
                'address'    => ['nullable', 'string', 'max:500'],
                'latitude'   => ['nullable', 'required_with:longitude', 'numeric', 'between:-90,90'],
                'longitude'  => ['nullable', 'required_with:latitude', 'numeric', 'between:-180,180'],
            ],
            'storeRegistration' => [
                'full_name'          => ['required', 'string', 'max:150'],
                'gender'             => ['nullable', 'in:L,P'],
                'birth_date'         => ['nullable', 'date', 'before:' . LocalTime::today()],
                'school_name'        => ['nullable', 'string', 'max:150'],
                'education_level_id' => ['required', 'uuid', Rule::exists(EducationLevel::class, 'id')->where('is_active', true)],
                'package_id'         => ['nullable', 'uuid', Rule::exists(Package::class, 'id')->where('is_active', true)],
                'note'               => ['nullable', 'string', 'max:1000'],
                // Email login anak (opsional): kosong = dibuatkan otomatis dari NIS saat disetujui
                'login_email'        => ['nullable', 'email', 'max:100', Rule::unique(User::class, 'email')],
            ],
            default => [],
        };
    }

    public function messages(): array
    {
        return [
            'from.required'                  => 'Tanggal awal wajib diisi.',
            'to.after_or_equal'              => 'Tanggal akhir harus setelah tanggal awal.',
            'proposed_date.required'         => 'Tanggal pengganti wajib diisi.',
            'proposed_date.after_or_equal'   => 'Tanggal pengganti tidak boleh sebelum hari ini.',
            'proposed_start_time.required'   => 'Jam pengganti wajib diisi.',
            'reason.required'                => 'Alasan wajib diisi.',
            'reason.min'                     => 'Alasan minimal 5 karakter.',
            'phone.regex'                    => 'Nomor HP hanya boleh angka, spasi, + atau - (8-20 karakter).',
            'phone.unique'                   => 'Nomor HP sudah digunakan akun lain.',
            'full_name.required'             => 'Nama lengkap anak wajib diisi.',
            'birth_date.before'              => 'Tanggal lahir tidak valid.',
            'education_level_id.required'    => 'Jenjang / kelas sekolah wajib dipilih.',
            'education_level_id.exists'      => 'Jenjang tidak tersedia.',
            'package_id.exists'              => 'Paket tidak tersedia.',
            'login_email.email'              => 'Format email login anak tidak valid.',
            'login_email.unique'             => 'Email login anak sudah dipakai akun lain.',
        ];
    }
}
