<?php

namespace App\Http\Requests\Website;

use Illuminate\Foundation\Http\FormRequest;

class ActivityRequest extends FormRequest {
    public function authorize(): bool {
        return true;
    }

    public function rules(): array {
        return [
            'title' => [
                'required',
                'string',
                'max:255'
            ],

            'description' => [
                'nullable',
                'string'
            ],

            'activity_date' => [
                'required',
                'date'
            ],

            'location' => [
                'nullable',
                'string',
                'max:255'
            ],

            'cover_image' => [
                'nullable',
                'string'
            ],

            'is_active' => [
                'nullable',
                'boolean'
            ]
        ];
    }
}