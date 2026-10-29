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
            // Bukti transfer wajib (D-11): nomor referensi dan berkas
            'reference_no'   => ['required', 'string', 'max:100'],
            'proof'          => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'note'           => ['nullable', 'string', 'max:500'],
            // Konfirmasi mode operator tunggal (lihat FinanceApproval)
            'password'       => ['nullable', 'string'],
            'approval_note'  => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function messages(): array
    {
        return [
            'reference_no.required' => 'Nomor referensi transfer wajib diisi.',
            'proof.required'        => 'Unggah bukti transfer (foto atau PDF).',
            'proof.mimes'           => 'Bukti transfer harus berupa JPG, PNG, WEBP, atau PDF.',
            'proof.max'             => 'Ukuran bukti transfer maksimal 5 MB.',
        ];
    }
}
