<?php

namespace App\Http\Requests\Website;

use Illuminate\Foundation\Http\FormRequest;

class TestimonialRequest extends FormRequest {
    public function authorize(): bool {
        return true;
    }

    public function rules(): array {
        return [
            'student_name' => [
                'required',
                'string',
                'max:255'
            ],

            'school_name' => [
                'required',
                'string',
                'max:255'
            ],

            'testimonial' => [
                'required',
                'string'
            ],

            'photo_url' => [
                'nullable',
                'string'
            ],

            'rating' => [
                'required',
                'integer',
                'between:1,5'
            ],

            'is_active' => [
                'boolean'
            ]
        ];
    }
}