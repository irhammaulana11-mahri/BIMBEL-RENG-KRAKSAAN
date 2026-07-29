<?php

namespace App\Http\Requests\Website;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Website\Lead;

class LeadRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        // CARA AMAN: Mengambil parameter ID dari segmen URL rute Laravel secara langsung 
        // tanpa bergantung pada instansiasi objek Model.
        $leadId = $this->route('lead') ?? $this->route('id');
        
        // Jika berupa objek model (karena implicit binding), ambil properti id-nya
        if (is_object($leadId)) {
            $leadId = $leadId->id;
        }

        return [
            'parent_name' => ['required', 'string', 'max:150'],
            'phone' => ['required', 'string', 'max:20', Rule::unique(Lead::class, 'phone')->ignore($leadId),],
            'email' => ['required', 'string', 'max:100', Rule::unique(Lead::class, 'email')->ignore($leadId),],
            'student_name' => ['required', 'string', 'max:150'],
            'education_level' => ['required', 'string', 'max:50'],
            'package_id' => ['nullable', 'uuid'],
            'notes' => ['nullable', 'string'],

            'status' => [
                'nullable',
                Rule::in([
                    'NEW',
                    'CONTACTED',
                    'REGISTERED',
                    'REJECTED'
                ])
            ]
        ];
    }

    /**
     * Kustomisasi pesan error agar dinamis memberi tahu mana yang duplikat
     */
    public function messages(): array
    {
        return [
            'phone.unique' => 'Nomor WhatsApp ini sudah terdaftar di sistem antrean kami.',
            'email.unique' => 'Alamat email ini sudah digunakan oleh pendaftar lain.',
            'email.email'   => 'Format alamat email yang Anda masukkan tidak valid.',
        ];
    } 
}