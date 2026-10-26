<?php

namespace App\Http\Requests\Finance;

use App\Models\Admin\Tentor;
use App\Support\LocalTime;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PayrollTransferRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tentor_id'      => ['required', 'uuid', Rule::exists(Tentor::class, 'id')],
            'transfer_date'  => ['required', 'date', 'before_or_equal:' . LocalTime::today()],
            'source_account' => ['nullable', 'string', 'max:100'],
            'reference_no'   => ['nullable', 'string', 'max:100'],
            'note'           => ['nullable', 'string', 'max:500'],
        ];
    }
}
