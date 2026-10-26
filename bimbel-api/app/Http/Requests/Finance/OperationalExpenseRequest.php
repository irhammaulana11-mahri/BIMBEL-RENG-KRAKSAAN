<?php

namespace App\Http\Requests\Finance;

use App\Models\Finance\OperationalExpense;
use App\Models\Finance\Payment;
use App\Support\LocalTime;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class OperationalExpenseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'expense_date'   => ['required', 'date', 'before_or_equal:' . LocalTime::today()],
            'category'       => ['required', Rule::in(array_keys(OperationalExpense::CATEGORIES))],
            'title'          => ['required', 'string', 'max:200'],
            'amount'         => ['required', 'numeric', 'gt:0'],
            'payment_method' => ['required', Rule::in(Payment::METHODS)],
            'note'           => ['nullable', 'string', 'max:1000'],
        ];
    }
}
