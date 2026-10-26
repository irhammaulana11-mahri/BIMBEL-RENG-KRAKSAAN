<?php

namespace App\Http\Requests\Academic;

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
    public function authorize(): bool {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        // Mendapatkan nama method controller yang sedang dieksekusi
        $method = $this->route()->getActionMethod();

        return match ($method) {
            'updatePattern' => [
                'day_of_week'  => ['required', 'integer', 'between:0,6'],
                'start_time'   => ['required', 'date_format:H:i'],
                'end_time'     => ['required', 'date_format:H:i', 'after:start_time'],
                'tentor_id'    => ['required', 'uuid'],
                'location_id'  => ['nullable', 'uuid'],
                'room_name'    => ['nullable', 'string', 'max:100'],
                'meeting_url'  => ['nullable', 'url'],
                // 🟢 Pilihan penerapan perubahan pola ke session
                'apply_method' => ['required', 'in:none,uncompleted,date'], 
                'apply_date'   => ['required_if:apply_method,date', 'nullable', 'date'],
            ],
            
            'toggleStatus' => [
                'is_active' => ['required', 'boolean']
            ],
            'updateDetails' => [
                'class_id'             => ['required', 'uuid', Rule::exists(ClassRoom::class, 'id')],
                'subject_id'           => ['required', 'uuid', Rule::exists(Subject::class, 'id')],
                'tentor_id'            => ['required', 'uuid', Rule::exists(Tentor::class, 'id')],
                'location_id'          => ['nullable', 'uuid', Rule::exists(LearningLocation::class, 'id')],
                'room_name'            => ['nullable', 'string', 'max:100'],
                'meeting_url'          => ['nullable', 'url'],
                'day_of_week'          => ['required', 'integer', 'between:0,6'],
                'start_time'           => ['required'],
                'end_time'             => ['required', 'after:start_time'],
                'is_active'            => ['nullable', 'boolean']
            ],

            // Rules untuk validasi Wizard Step 2
            'validateWizard' => [
                'patterns'             => ['required', 'array'],
                'patterns.*.subject_id'=> ['required', 'uuid', Rule::exists(Subject::class, 'id')],
                'patterns.*.tentor_id' => ['required', 'uuid', Rule::exists(Tentor::class, 'id')],
                'patterns.*.day_of_week'=> ['required', 'integer', 'between:0,6'],
                'patterns.*.start_time' => ['required', 'date_format:H:i'],
                'patterns.*.end_time'   => ['required', 'date_format:H:i', 'after:patterns.*.start_time'],
                'patterns.*.subject_name'=> ['nullable', 'string'],
                'patterns.*.tentor_name' => ['nullable', 'string'],
            ],

            // Rules untuk penyimpanan massal Wizard (5-Step)
            'storeWizard' => [
                'class_id'             => ['required', 'uuid', Rule::exists(ClassRoom::class, 'id')],
                'location_id'          => ['nullable', 'uuid', Rule::exists(LearningLocation::class, 'id')],
                'room_name'            => ['nullable', 'string', 'max:100'],
                'meeting_url'          => ['nullable', 'url'],
                
                'patterns'             => ['required', 'array'],
                'patterns.*.subject_id'=> ['required', 'uuid', Rule::exists(Subject::class, 'id')],
                'patterns.*.tentor_id' => ['required', 'uuid', Rule::exists(Tentor::class, 'id')],
                'patterns.*.day_of_week'=> ['required', 'integer', 'between:0,6'],
                'patterns.*.start_time' => ['required', 'date_format:H:i'],
                'patterns.*.end_time'   => ['required', 'date_format:H:i'],
                
                'sessions'             => ['required', 'array'],
                'sessions.*.subject_id'=> ['required', 'uuid', Rule::exists(Subject::class, 'id')],
                'sessions.*.tentor_id' => ['required', 'uuid', Rule::exists(Tentor::class, 'id')],
                'sessions.*.meeting_no'=> ['required', 'integer'],
                'sessions.*.session_date'=> ['required', 'date'],
                'sessions.*.start_time' => ['required', 'date_format:H:i'],
                'sessions.*.end_time'   => ['required', 'date_format:H:i'],
            ],

            // Default rules (digunakan untuk endpoint store/update single schedule biasa)
            default => [
                'class_id'              => ['required', Rule::exists(ClassRoom::class, 'id')], 
                'subject_id'            => ['required', Rule::exists(Subject::class, 'id')],
                'tentor_id'             => ['required', Rule::exists(Tentor::class, 'id')],            
                'learning_location_id'  => ['nullable', Rule::exists(LearningLocation::class, 'id')],
                'room_name'             => ['nullable', 'string', 'max:100'],
                'meeting_url'           => ['nullable', 'url'],
                'day_of_week'           => ['required', 'integer', 'between:0,6'],            
                'start_time'            => ['required'],
                'end_time'              => ['required', 'after:start_time'],
                'is_active'             => ['nullable', 'boolean']

            ],
        };
    }
}