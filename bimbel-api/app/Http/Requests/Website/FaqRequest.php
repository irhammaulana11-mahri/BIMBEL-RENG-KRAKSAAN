<?php

namespace App\Http\Requests\Website;

use Illuminate\Foundation\Http\FormRequest;

class FaqRequest extends FormRequest {
    public function authorize(): bool {
        return true;
    }

    public function rules(): array {
        return [
            'question' => [
                'required',
                'string'
            ],

            'answer' => [
                'required',
                'string'
            ],

            'sort_order' => [
                'nullable',
                'integer'
            ],

            'is_active' => [
                'boolean'
            ]
        ];
    }
}