<?php

namespace App\Http\Requests\Website;

use Illuminate\Foundation\Http\FormRequest;

class ActivityImageRequest extends FormRequest {
    public function authorize(): bool {
        return true;
    }

    public function rules(): array {
        return [
            'activity_id' => [
                'required',
                'uuid'
            ],

            'image_url' => [
                'required',
                'string'
            ]
        ];
    }
}