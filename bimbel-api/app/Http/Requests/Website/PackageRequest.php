<?php

namespace App\Http\Requests\Website;

use Illuminate\Foundation\Http\FormRequest;

class PackageRequest extends FormRequest {
    public function authorize(): bool {
        return true;
    }

    public function rules(): array {
        return [
            'package_name' => ['required','string','max:255'],
            'education_level' => ['required','string','max:100'],
            'description' => ['nullable','string'],
            'default_price' => ['required','numeric'],
            'meeting_per_month' => ['required','integer'],
            'duration_minutes' => ['required','integer'],
            'class_type' => ['required','string','max:10'],
            'is_active' => ['boolean'],
        ];
    }
}