<?php

namespace App\Http\Requests\Academic;

use App\Models\Academic\Curriculum;
use App\Models\Admin\Tentor;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;


class MaterialRequest extends FormRequest {
    public function authorize(): bool {
        return true;
    }

    public function rules(): array {
        return [
            'curriculum_id'    => ['required', Rule::exists(Curriculum::class, 'id')],
            'tentor_id'        => ['nullable', Rule::exists(Tentor::class, 'id')],
            'title'            => ['required', 'string', 'max:200'],
            'description'      => ['nullable', 'string'],
            'material_type'    => ['required', 'string', 'max:30'],
            'file_path'        => ['nullable', 'string'],
            'video_url'        => ['nullable', 'url'],
            'external_url'     => ['nullable', 'url'],
            'duration_minutes' => ['nullable', 'integer', 'min:1'],
            'sort_order'       => ['nullable', 'integer'],
            'is_active'        => ['boolean'],
        ];
    }
}