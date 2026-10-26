<?php

namespace App\Http\Requests\Admin;

use App\Models\Admin\Subject;
use App\Models\Admin\EducationLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;


class SubjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $routeParam = $this->route('subject');
        $subjectId = is_object($routeParam) ? $routeParam->id : $routeParam;
        
        return [
            // Urutan sesuai usulan UI Anda
            'code'               => ['required', 'string', 'max:20', Rule::unique(Subject::class, 'code')->ignore($subjectId)],
            'name'               => ['required', 'string', 'max:100'],
            'education_level_id' => ['required', Rule::exists(EducationLevel::class, 'id')],
            'description'        => ['nullable', 'string'],
            'is_active'          => ['boolean']
        ];
    }
}

// class SubjectRequest extends FormRequest
// {
//     public function authorize(): bool
//     {
//         return true;
//     }

//     public function rules(): array
//     {
//         $subject = $this->route('subject');
//         $subjectId = $subject?->id;
        
//         return [
//             'code' => ['required','string','max:20',
//                 Rule::unique(Subject::class, 'code')
//                     ->ignore($subjectId)
//             ],
//             'name' => ['required','string','max:100'],
//             'education_level' => ['required','string','max:30'],
//             'description' => ['nullable','string'],
//             'is_active' => ['boolean']
//         ];
//     }
// }