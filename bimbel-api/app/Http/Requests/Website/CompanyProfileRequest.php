<?php

namespace App\Http\Requests\Website;

use Illuminate\Foundation\Http\FormRequest;

class CompanyProfileRequest extends FormRequest {
    public function authorize(): bool {
        return true;
    }

    public function rules(): array {
        return [
            'company_name' => ['required','string','max:255'],
            'address' => ['nullable','string'],
            'phone' => ['nullable','string','max:50'],
            'whatsapp' => ['nullable','string','max:50'],
            'email' => ['nullable','email'],
            'website_url' => ['nullable','url'],
            'facebook_url' => ['nullable','url'],
            'instagram_url' => ['nullable','url'],
            'youtube_url' => ['nullable','url'],
            'latitude' => ['nullable','numeric'],
            'longitude' => ['nullable','numeric'],
            'logo_url' => ['nullable','string'],
        ];
    }
}