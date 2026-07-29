<?php

namespace App\Http\Requests\Academic;

use App\Models\Academic\Schedule;
use App\Models\Academic\ClassRoom;
use App\Models\Admin\Tentor;
use App\Models\Academic\LearningLocation;
use App\Models\Admin\Subject;
use Illuminate\Validation\Rule;
use Illuminate\Foundation\Http\FormRequest;

class ScheduleRequest extends FormRequest
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
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'class_id'    => ['required', Rule::exists(ClassRoom::class, 'id')], 
            'subject_id'  => ['required', Rule::exists(Subject::class, 'id')],
            'tentor_id'   => ['required', Rule::exists(Tentor::class, 'id')],            
            'location_id' => ['nullable', Rule::exists(LearningLocation::class, 'id')],
            'room_name'   => ['nullable', 'string', 'max:100'],
            'meeting_url' => ['nullable', 'url'],
            'day_of_week' => ['required', 'integer', 'between:0,6'],            
            'start_time'  => ['required'],
            'end_time'    => ['required', 'after:start_time'],
            'is_active'   => ['nullable', 'boolean']
        ];
    }
}