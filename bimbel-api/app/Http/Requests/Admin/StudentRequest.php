<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use App\Models\Admin\ParentModel;
use Illuminate\Validation\ValidationException;


class StudentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array {
         $rules = [
            'user_id' => ['nullable','uuid'],
            'full_name' => ['required','string','max:150'],
            'nis' => ['nullable','string','max:30'],
            'gender' => ['nullable','string','max:10'],
            'birth_date' => ['nullable','date'],
            'education_level' => ['nullable','string','max:30'],
            'school_name' => ['nullable','string','max:150'],
            'grade' => ['nullable','string','max:20'],
            'is_active' => ['nullable', 'boolean'],
            // Titik rumah: sasaran absen GPS tentor untuk kelas PRIVATE
            'home_address' => ['nullable','string','max:500'],
            'home_latitude' => ['nullable','required_with:home_longitude','numeric','between:-90,90'],
            'home_longitude' => ['nullable','required_with:home_latitude','numeric','between:-180,180'],
        ];
            if ($this->isMethod('post')) {
                $rules['parent_id'] = [
                    'required',
                    // 'exists:parents,id'
                ];
            }

            return $rules;
            // 'parent_id' => [
            //     'required',
            //     Rule::exists(ParentModel::class, 'id')
        //     ],
        // ];
    }

    public function messages(): array {
        return [
            'home_latitude.required_with'  => 'Titik rumah belum lengkap (latitude dan longitude wajib diisi bersamaan).',
            'home_longitude.required_with' => 'Titik rumah belum lengkap (latitude dan longitude wajib diisi bersamaan).',
        ];
    }
}
