<?php

namespace App\Http\Requests\Academic;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;


class GetStudentAttendanceSessionsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array {
        return [
            'filter_mode' => ['nullable', 'in:harian,bulanan'],
            'date'        => ['required_if:filter_mode,harian', 'nullable', 'date'],
            'month'       => ['required_if:filter_mode,bulanan', 'nullable', 'date_format:Y-m'],
            'keyword'     => ['nullable', 'string'],
            'status'      => ['nullable', 'in:SELESAI,BELUM'],
        ];
    }
}
