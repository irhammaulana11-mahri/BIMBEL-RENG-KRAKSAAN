<?php

namespace App\Http\Requests\Finance;

use App\Support\LocalTime;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Konfirmasi transfer + bukti bayar oleh orang tua.
 */
class ParentPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount'          => ['required', 'numeric', 'gt:0'],
            'payment_date'    => ['required', 'date', 'before_or_equal:' . LocalTime::today()],
            'payment_channel' => ['required', 'string', 'max:50'],
            'reference_no'    => ['nullable', 'string', 'max:100'],
            'note'            => ['nullable', 'string', 'max:500'],
            'proof'           => ['required', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'proof.required'           => 'Bukti transfer wajib diunggah.',
            'proof.mimes'              => 'Bukti transfer harus berupa gambar (JPG/PNG/WEBP) atau PDF.',
            'proof.max'                => 'Ukuran bukti transfer maksimal 5 MB.',
            'payment_channel.required' => 'Bank / channel pembayaran wajib diisi.',
        ];
    }
}
