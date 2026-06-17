<?php

namespace App\Http\Requests\Website;

use Illuminate\Foundation\Http\FormRequest;

class ArticleCategoryRequest extends FormRequest {
    public function authorize(): bool {
        return true;
    }

    public function rules(): array {
        return [
            'category_name' => [
                'required',
                'string',
                'max:100'
            ]
        ];
    }
}