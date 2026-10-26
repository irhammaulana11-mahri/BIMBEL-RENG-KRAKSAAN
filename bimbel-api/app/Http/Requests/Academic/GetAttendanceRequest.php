<?php

namespace App\Http\Requests\Academic;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;


class GetAttendanceRequest extends FormRequest {
    public function authorize(): bool {
        return true;
    }

    public function rules(): array {
        return [
            'filter_mode' => ['nullable', 'in:harian,bulanan'],
            'date'        => ['required_if:filter_mode,harian', 'nullable', 'date'],
            'month'       => ['required_if:filter_mode,bulanan', 'nullable', 'date_format:Y-m'],
            'keyword'     => ['nullable', 'string'],
            'status'      => ['nullable', 'string'],
        ];
    }
}
