<?php

namespace App\Http\Requests\Admin;

use App\Models\Admin\Tentor;
use App\Models\Admin\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TentorRequest extends FormRequest {
    public function authorize(): bool {
        return true;
    }

    public function rules(): array {
        $tentor = $this->route('tentor');
        $userId = $tentor?->user?->id;

        $rules = [

            'specialization' => ['required','string','max:100'],
            'education'      => ['required','string','max:150'],
            'joining_date'   => ['nullable','date'],

            'nik' => [
                'required',
                'string',
                'max:30',
                Rule::unique(Tentor::class,'nik')
                    ->ignore($tentor)
            ],

            'gender'      => ['required', Rule::in(['L','P'])],
            'birth_date'  => ['required','date'],
            'address'     => ['nullable','string'],
            'latitude'    => ['nullable','numeric'],
            'longitude'   => ['nullable','numeric'],
            'is_active'   => ['boolean'],

            'name' => ['required','string','max:100'],

            'email' => [
                'required',
                'email',
                Rule::unique(User::class,'email')
                    ->ignore($userId)
            ],

            'phone' => [
                'required',
                Rule::unique(User::class,'phone')
                    ->ignore($userId)
            ],

            'subject_ids' => ['nullable','array'],
        ];

        // ==========================
        // CREATE
        // ==========================

        if ($this->isMethod('post')) {

            $rules['password'] = [
                'required',
                'string',
                'min:6'
            ];

        }

        // ==========================
        // UPDATE
        // ==========================

        if ($this->isMethod('put') || $this->isMethod('patch')) {

            $rules['password'] = [
                'nullable',
                'string',
                'min:6'
            ];

        }

        return $rules;
    }
}