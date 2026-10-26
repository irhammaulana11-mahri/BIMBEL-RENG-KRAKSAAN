<?php

namespace App\Http\Requests\Finance;

use App\Models\Academic\ClassRoom;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GenerateInvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'period'      => ['required', 'date_format:Y-m'],
            'due_date'    => ['required', 'date'],
            'class_ids'   => ['nullable', 'array'],
            'class_ids.*' => ['uuid', 'distinct', Rule::exists(ClassRoom::class, 'id')],
        ];
    }

    public function messages(): array
    {
        return [
            'period.required'   => 'Periode tagihan wajib diisi.',
            'due_date.required' => 'Tanggal jatuh tempo wajib diisi.',
        ];
    }
}
