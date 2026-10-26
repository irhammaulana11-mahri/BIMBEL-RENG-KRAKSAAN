<?php

namespace App\Http\Requests\Academic;

use Illuminate\Foundation\Http\FormRequest;

class ScheduleSessionRequest extends FormRequest {
    public function authorize(): bool {
        return true;
    }

    public function rules(): array {
        // Mendapatkan nama fungsi/method di Controller yang sedang dijalankan
        // Contoh: 'cancelSession', 'rescheduleSession', dll.
        $method = $this->route()->getActionMethod();

        return match ($method) {
            'cancelSession' => [
                'reason' => ['required', 'string', 'max:30'],
            ],

            'updateSessionDetails' => [
                'meeting_url' => ['nullable', 'url'],
                'room_name'   => ['nullable', 'string', 'max:100'],
                'reason'      => ['required', 'string', 'max:30'],
                'note'        => ['nullable', 'string'],
                
            ],

            'validateReschedule' => [
                'schedule_session_id' => ['required', 'uuid'],
                'session_date'        => ['required', 'date'],
                'start_time'          => ['required', 'date_format:H:i'],
                'end_time'            => ['required', 'date_format:H:i', 'after:start_time'],
                'tentor_id'           => ['required', 'uuid'],
            ],

            'rescheduleSession' => [
                'session_date' => ['required', 'date'],
                'start_time'   => ['required', 'date_format:H:i'],
                'end_time'     => ['required', 'date_format:H:i', 'after:start_time'],
                'tentor_id'    => ['required', 'uuid'],
                'room_name'    => ['nullable', 'string', 'max:100'],
                'meeting_url'  => ['nullable', 'url'],
                'reason'       => ['required', 'string', 'max:30'],
                'note'         => ['nullable', 'string'],
            ],

            // Default fallback jika nama method tidak cocok
            default => [], 
        };
    }
}