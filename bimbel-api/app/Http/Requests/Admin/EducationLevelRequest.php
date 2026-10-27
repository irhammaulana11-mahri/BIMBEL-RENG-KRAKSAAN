<?php

namespace App\Http\Requests\Admin;

use App\Models\Admin\EducationLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;


class EducationLevelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $educationLevel = $this->route('education_level');
        $education_level_id = $educationLevel?->id;

        return [
             'level_code' => ['required','string','max:20',
                Rule::unique(EducationLevel::class, 'level_code')
                    ->ignore($education_level_id)
            ],
            'education_level' => ['required','string','max:100'],
            // Kombinasi jenjang + tingkat harus unik (uq_education_levels_level_grade)
            'grade_level'     => ['required','integer','min:1',
                Rule::unique(EducationLevel::class, 'grade_level')
                    ->where('education_level', $this->input('education_level'))
                    ->ignore($education_level_id)
            ],
            'display_name'    => ['required','string','max:100'],
            'sort_order'      => ['nullable','integer'],
            'is_active'       => ['boolean'],
            'description'     => ['nullable','string'],
        ];
    }

    public function messages(): array
    {
        return [
            'level_code.unique'  => 'Kode jenjang sudah digunakan.',
            'grade_level.unique' => 'Tingkat kelas ini sudah ada pada jenjang tersebut.',
        ];
    }
}
