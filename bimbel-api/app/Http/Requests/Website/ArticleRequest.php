<?php

namespace App\Http\Requests\Website;

use Illuminate\Foundation\Http\FormRequest;

class ArticleRequest extends FormRequest {
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

            'summary' => [
                'nullable',
                'string'
            ],

            'content' => [
                'required',
                'string'
            ],

            'featured_image' => [
                'nullable',
                'string'
            ],

            // 'author_id' => [
            //     'nullable',
            //     'uuid'
            // ],

            'publish_date' => [
                'nullable',
                'date'
            ],

            'is_published' => [
                'boolean'
            ],

            'categories' => [
                'nullable',
                'array'
            ],

            'categories.*' => [
                'uuid'
            ]
        ];
    }
}