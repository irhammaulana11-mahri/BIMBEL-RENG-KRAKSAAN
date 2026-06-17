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
            'price' => ['required','numeric'],
            'meeting_per_month' => ['required','integer'],
            'duration_minutes' => ['required','integer'],
            'is_home_visit' => ['boolean'],
            'is_building_class' => ['boolean'],
            'is_active' => ['boolean'],
        ];
    }
}