<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $userId = $this->route('user');

        if (is_object($userId)) {
            $userId = $userId->id;
        }

        $rules = ['role_id' => ['required', 'uuid'],
            'name' => ['required', 'string', 'max:100'],
            'email' => ['nullable','email',Rule::unique('master.users','email')->ignore($userId),],
            'phone' => ['nullable','max:20',Rule::unique('master.users', 'phone')->ignore($userId),],
            'is_active' => ['nullable', 'boolean'],
        ];

        if ($this->isMethod('POST')) {
            $rules['password'] = ['required','min:6','confirmed'];
        }
        return $rules;
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Nama wajib diisi.',
            'email.unique' => 'Email sudah digunakan.',
            'phone.unique' => 'Nomor HP sudah digunakan.',
            'password.confirmed' => 'Konfirmasi password tidak sama.',
        ];
    }
}
