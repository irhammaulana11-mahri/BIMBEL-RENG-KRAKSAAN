<?php

namespace App\Http\Requests\Academic;

use App\Models\Academic\ClassRoom;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ClassRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $class = $this->route('class');
        return [
            'code' => ['required','string','max:20',Rule::unique(ClassRoom::class, 'code')->ignore($this->route('class')?->id),],
            'name' => ['required','string','max:150',],
            'education_level' => ['required',Rule::in(['TK','SD','SMP','SMA','UMUM']),],
            'class_type' => ['required',Rule::in(['private','reguler','online']),],
            'max_students' => ['required','integer','min:1','max:30',],
            'description' => ['nullable','string',],
            'is_active' => ['required','boolean',],
        ];
    }
}