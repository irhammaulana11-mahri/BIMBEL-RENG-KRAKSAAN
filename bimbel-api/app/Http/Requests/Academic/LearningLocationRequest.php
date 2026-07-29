<?php

namespace App\Http\Requests\Academic;

use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;
use App\Models\Academic\LearningLocation;

class LearningLocationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array {
        $location = $this->route('location');
        $locationId = $location?->id;

        return [
            'code'=>['required','string','max:20',
                Rule::unique(Learninglocation::class,'code')
                    ->ignore($locationId)
            ],

            'location_name'=>['required','string','max:150'],
            'address'=>['required','string'],
            'latitude'=>['required','numeric','between:-90,90'],
            'longitude'=>['required','numeric','between:-180,180'],
            'radius_meter'=>['required','integer','min:5','max:1000'],
            'description'=>['nullable','string'],
            'is_active'=>['boolean'],
        ];
    }

    public function messages(): array {
        return [
            'code.required'=>'Kode lokasi wajib diisi.',
            'code.unique'=>'Kode lokasi sudah digunakan.',
            'location_name.required'=>'Nama lokasi wajib diisi.',
            'latitude.required'=>'Latitude wajib diisi.',
            'longitude.required'=>'Longitude wajib diisi.',
            'radius_meter.required'=>'Radius absensi wajib diisi.',
        ];
    }
}
