<?php

namespace App\Http\Requests\Academic;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ClassStatusRequest extends FormRequest
{
    public function authorize(): bool {
        return true;
    }

    protected function prepareForValidation(): void {
        if ($this->has('status')) {
            $this->merge([
                'status' => strtoupper(trim($this->status)),
            ]);
        }
    }

    public function rules(): array {
        return [
            'status' => [
                'required',
                'string',
                Rule::in(['DRAFT', 'ACTIVE', 'ON_PROGRESS', 'COMPLETED', 'SELESAI', 'ARCHIVED']),
            ],
        ];
    }
}