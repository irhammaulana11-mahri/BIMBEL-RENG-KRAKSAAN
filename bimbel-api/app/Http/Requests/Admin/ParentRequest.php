<?php

namespace App\Http\Requests\Admin;
use Illuminate\Foundation\Http\FormRequest;

class ParentRequest extends FormRequest {
    public function authorize(): bool {
        return true;
    }

    public function rules(): array {
        return [
            'full_name' => ['required','string','max:100'],
            'occupation' => ['nullable','string','max:100'],
            'relationship' => ['nullable','string','max:50'],
            'address' => ['nullable','string'],
            // Titik rumah keluarga (ikut tersalin ke data anak)
            'latitude' => ['nullable','required_with:longitude','numeric','between:-90,90'],
            'longitude' => ['nullable','required_with:latitude','numeric','between:-180,180'],
        ];
    }
}