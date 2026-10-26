<?php

namespace App\Http\Requests\Finance;

use App\Models\Admin\Student;
use App\Models\Finance\Payment;
use App\Support\LocalTime;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Pembayaran yang dicatat langsung oleh Admin (tunai / transfer yang sudah diterima).
 */
class PaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id'             => ['required', 'uuid', Rule::exists(Student::class, 'id')],
            'payment_date'           => ['required', 'date', 'before_or_equal:' . LocalTime::today()],
            'payment_method'         => ['required', Rule::in(Payment::METHODS)],
            'payment_channel'        => ['nullable', 'string', 'max:50'],
            'reference_no'           => ['nullable', 'string', 'max:100'],
            'note'                   => ['nullable', 'string', 'max:1000'],
            'allocations'            => ['required', 'array', 'min:1'],
            'allocations.*.invoice_id' => ['required', 'uuid', 'distinct'],
            'allocations.*.amount'   => ['required', 'numeric', 'gt:0'],
        ];
    }
}
