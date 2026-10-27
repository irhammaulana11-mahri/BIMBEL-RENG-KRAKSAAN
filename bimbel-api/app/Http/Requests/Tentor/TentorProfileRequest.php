<?php

namespace App\Http\Requests\Tentor;

use App\Models\Admin\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rule;

/**
 * Data yang boleh diubah tentor sendiri. Nama, email, NIK, dan tarif diubah Admin.
 */
class TentorProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'phone'   => ['nullable', 'string', 'max:20', 'regex:/^[0-9+\- ]{8,20}$/', Rule::unique(User::class, 'phone')->ignore(Auth::id())],
            'address' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'phone.regex'  => 'Nomor HP hanya boleh angka, spasi, + atau - (8-20 karakter).',
            'phone.unique' => 'Nomor HP sudah digunakan akun lain.',
        ];
    }
}
