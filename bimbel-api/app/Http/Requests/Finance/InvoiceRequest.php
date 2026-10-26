<?php

namespace App\Http\Requests\Finance;

use App\Models\Academic\ClassRoom;
use App\Models\Admin\Student;
use App\Models\Finance\InvoiceItem;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

/**
 * Tagihan manual (biaya pendaftaran, modul, dll).
 */
class InvoiceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id'         => ['required', 'uuid', Rule::exists(Student::class, 'id')],
            'class_id'           => ['required', 'uuid', Rule::exists(ClassRoom::class, 'id')],
            'issue_date'         => ['nullable', 'date'],
            'due_date'           => ['required', 'date'],
            'discount'           => ['nullable', 'numeric', 'min:0'],
            'note'               => ['nullable', 'string', 'max:1000'],
            'items'              => ['required', 'array', 'min:1'],
            'items.*.item_type'  => ['required', Rule::in(InvoiceItem::TYPES)],
            'items.*.item_name'  => ['required', 'string', 'max:200'],
            'items.*.description'=> ['nullable', 'string'],
            'items.*.quantity'   => ['required', 'integer', 'min:1'],
            'items.*.unit_price' => ['required', 'numeric', 'min:0'],
            'items.*.discount'   => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
