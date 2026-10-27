<?php

namespace App\Http\Requests\Account;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;

class UpdatePasswordRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'current_password' => ['required', 'string', function ($attribute, $value, $fail) {
                if (!Hash::check($value, Auth::user()->password)) $fail('Password saat ini salah.');
            }],
            'password'         => ['required', 'string', 'min:8', 'confirmed', 'different:current_password'],
        ];
    }

    public function messages(): array
    {
        return [
            'current_password.required' => 'Password saat ini wajib diisi.',
            'password.required'         => 'Password baru wajib diisi.',
            'password.min'              => 'Password baru minimal 8 karakter.',
            'password.confirmed'        => 'Konfirmasi password baru tidak cocok.',
            'password.different'        => 'Password baru harus berbeda dari password saat ini.',
        ];
    }
}
