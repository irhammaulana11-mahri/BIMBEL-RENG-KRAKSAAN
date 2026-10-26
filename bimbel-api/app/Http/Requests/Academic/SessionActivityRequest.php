<?php

namespace App\Http\Requests\Academic;

use App\Models\Academic\ScheduleSession;
use App\Models\Academic\SessionActivity;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SessionActivityRequest extends FormRequest
{
    public function authorize(): bool {
        return true;
    }

    protected function prepareForValidation(): void {
        if ($this->has('activity_type')) {
            $this->merge(['activity_type' => strtoupper(trim((string) $this->activity_type)),]);
        }

        if ($this->has('status')) {
            $this->merge(['status' => strtoupper(trim((string) $this->status)),]);
        }
    }

    public function rules(): array {
        $isCreate = $this->isMethod('post');

        return [
            // schedule_session_id hanya dikirim saat membuat aktivitas
            'schedule_session_id'   => [$isCreate ? 'required' : 'prohibited','uuid',Rule::exists(ScheduleSession::class,'id'),],
            'activity_type'         => [$isCreate ? 'required' : 'sometimes','string',Rule::in(SessionActivity::TYPES),],
            'title'                 => [$isCreate ? 'required' : 'sometimes','string','max:150',],
            'description'           => ['nullable','string',],
            'activityable_id'       => ['nullable','uuid',],
            'display_order'         => ['nullable','integer','min:1','max:100',],
            'status'                => [$isCreate ? 'nullable' : 'prohibited','string',Rule::in(['DRAFT','READY',]),],
            'start_time'            => ['nullable','date_format:H:i',],
            'end_time'              => ['nullable','date_format:H:i','after:start_time',],
            'note'                  => ['nullable','string',],
        ];
    }
}
