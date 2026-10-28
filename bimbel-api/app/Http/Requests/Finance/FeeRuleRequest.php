<?php

namespace App\Http\Requests\Finance;

use App\Models\Admin\Tentor;
use App\Models\Finance\FeeRule;
use App\Models\Website\Package;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class FeeRuleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        // Cakupan kosong dari form ("") = berlaku untuk semua
        $this->merge(collect(['class_type', 'package_id', 'education_level', 'tentor_id', 'effective_to'])
            ->mapWithKeys(fn($f) => [$f => $this->filled($f) ? $this->input($f) : null])
            ->all());
        if ($this->input('rule_type') === 'BILLING') $this->merge(['tentor_id' => null]);
        if ($this->input('method') === 'MONTHLY') $this->merge(['counted_statuses' => []]);
    }

    public function rules(): array
    {
        return [
            'rule_type'          => ['required', Rule::in(FeeRule::TYPES)],
            'name'               => ['required', 'string', 'max:150'],
            'class_type'         => ['nullable', Rule::in(['PRIVATE', 'REGULER', 'ONLINE'])],
            'package_id'         => ['nullable', 'uuid', Rule::exists(Package::class, 'id')],
            'education_level'    => ['nullable', 'string', 'max:30'],
            'tentor_id'          => ['nullable', 'uuid', Rule::exists(Tentor::class, 'id')],
            'method'             => ['required', Rule::in(FeeRule::METHODS[$this->input('rule_type')] ?? [])],
            'amount'             => ['required', 'numeric', 'min:0'],
            'counted_statuses'   => ['nullable', 'array'],
            'counted_statuses.*' => [Rule::in(FeeRule::STUDENT_STATUSES), 'distinct'],
            'effective_from'     => ['required', 'date'],
            'effective_to'       => ['nullable', 'date', 'after_or_equal:effective_from'],
            'is_active'          => ['boolean'],
            'note'               => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required'           => 'Nama aturan wajib diisi.',
            'method.in'               => 'Metode tidak tersedia untuk jenis aturan ini.',
            'amount.required'         => 'Nominal tarif wajib diisi.',
            'effective_from.required' => 'Tanggal mulai berlaku wajib diisi.',
            'effective_to.after_or_equal' => 'Tanggal akhir harus setelah tanggal mulai berlaku.',
        ];
    }
}
