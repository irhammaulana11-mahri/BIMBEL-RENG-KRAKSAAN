<?php

namespace App\Http\Requests\Tentor;

use Illuminate\Foundation\Http\FormRequest;

class TentorScheduleRequest extends FormRequest {
    
    public function authorize(): bool { 
        return true; 
    }

    public function rules(): array {
        // Mengambil nama function/method pada Controller yang sedang dijalankan
        // Contoh kembalian: 'index', 'storeActivity', 'requestReschedule'
        $action = $this->route()->getActionMethod();

        return match ($action) {
            
            // 1. Validasi saat memuat jadwal (Method: index / getSchedules)
            'index', 'getSchedules' => [
                'filter_mode' => ['required', 'in:hari_ini,minggu_ini,bulanan'], 
                'month'       => ['required_if:filter_mode,bulanan', 'nullable', 'date_format:Y-m'],
                'keyword'     => ['nullable', 'string'],
                'status'      => ['nullable', 'string'],
                'class_type'  => ['nullable', 'string'],
            ],

            // 2. Validasi saat menambah aktivitas kelas (Method: storeActivity)
            'storeActivity' => [
                'type'            => ['required', 'string', 'in:MATERIAL,DISCUSSION,EXAM,REVIEW'],
                'title'           => ['required', 'string', 'max:255'],
                'description'     => ['nullable', 'string'],
                'start_time'      => ['required', 'date_format:H:i'],
                'end_time'        => ['required', 'date_format:H:i', 'after:start_time'],
                'activityable_id' => [
                    'nullable', 
                    'uuid',
                    function ($attribute, $value, $fail) {
                        $type = $this->input('type');
                        if (in_array($type, ['MATERIAL', 'EXAM']) && empty($value)) {
                            $fail("Data master (Materi/Exam) wajib dipilih untuk tipe {$type}.");
                        }
                    },
                ],
            ],

            // 2a. Validasi saat mengubah urutan aktivitas (Method: reorderActivities)
            'reorderActivities' => [
                'activity_ids'   => ['required', 'array', 'min:1'],
                'activity_ids.*' => ['required', 'uuid', 'distinct'],
            ],

            // 3. Validasi saat mengajukan reschedule (Method: requestReschedule)
            'requestReschedule', 'submitReschedule' => [
                'reason'        => ['required', 'string', 'min:5', 'max:255'],
                'proposed_date' => ['required', 'date_format:Y-m-d'],
                'proposed_time' => ['nullable', 'date_format:H:i'],
            ],

            // 3a. Absen masuk / pulang GPS (Method: startSession, endSession)
            'startSession', 'endSession' => [
                'latitude'  => ['nullable', 'numeric', 'between:-90,90', 'required_with:longitude'],
                'longitude' => ['nullable', 'numeric', 'between:-180,180', 'required_with:latitude'],
                'accuracy'  => ['nullable', 'numeric', 'min:0'],
                'source'    => ['nullable', 'in:WEB,ANDROID'],
            ],

            // 4. Riwayat kehadiran tentor (Method: attendances)
            'attendances' => [
                'month' => ['nullable', 'date_format:Y-m'],
            ],

            // Default jika tidak ada method yang cocok
            default => [],
        };
    }

    public function messages(): array {
        return [
            'filter_mode.required'      => 'Mode filter wajib diisi.',
            'filter_mode.in'            => 'Mode filter tidak valid.',
            'reason.required'           => 'Alasan reschedule wajib diisi.',
            'reason.min'                => 'Alasan minimal 5 karakter.',
            'proposed_date.date_format' => 'Format tanggal tidak valid.',
            'proposed_date.required'    => 'Usulan tanggal baru wajib diisi.',
            'proposed_time.date_format' => 'Format jam tidak valid (Gunakan format HH:MM).',
            'end_time.after'            => 'Waktu selesai harus lebih besar dari waktu mulai.',
        ];
    }
}