<?php

namespace App\Http\Requests\Website;

use Illuminate\Foundation\Http\FormRequest;

class LeadRequest extends FormRequest {
    public function authorize(): bool {
        return true;
    }

    public function rules(): array {
        return [

            'full_name' => [
                'required',
                'string',
                'max:255'
            ],

            'phone' => [
                'required',
                'string',
                'max:20'
            ],

            'education_level' => [
                'required',
                'string',
                'max:50'
            ],

            'package_id' => [
                'nullable',
                'uuid'
            ],

            'notes' => [
                'nullable',
                'string'
            ],

            'status' => [
                'nullable',
                'string'
            ]
        ];
    }
}