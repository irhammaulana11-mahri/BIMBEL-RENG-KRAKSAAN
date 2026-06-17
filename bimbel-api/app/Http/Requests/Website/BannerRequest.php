<?php

namespace App\Http\Requests\Website;
use Illuminate\Foundation\Http\FormRequest;

class BannerRequest extends FormRequest {
    public function authorize(): bool {
        return true;
    }

    public function rules(): array {
        return [
            'title' => ['required','string','max:255'],
            'subtitle' => ['nullable','string'],
            'image_url' => ['required','string'],
            'button_text' => ['nullable','string','max:100'],
            'button_link' => ['nullable','string'],
            'sort_order' => ['nullable','integer'],
            'is_active' => ['nullable','boolean'],
            'start_date' => ['nullable','date'],
            'end_date' => ['nullable','date'],
            'created_at' => ['nullable','date'],
            'updated_at' => ['nullable','date'],
        ];
    }
}