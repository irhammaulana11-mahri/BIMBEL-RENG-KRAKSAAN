<?php

namespace App\Http\Requests\Admin;

use App\Models\Admin\Subject;
use App\Models\Admin\Tentor;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TentorSubjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tentor_id' => ['required',Rule::exists(Tentor::class,'id')],
            'subject_id' => ['required',Rule::exists(Subject::class,'id')]

        ];
    }
}