<?php
namespace App\Services\Academic;

use App\Models\Academic\RescheduleRequest;
use App\Models\Academic\ScheduleSession;
use App\Support\LocalTime;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Pengajuan pindah jadwal sesi oleh orang tua / tentor, diputuskan Admin.
 * Disetujui -> sesi dipindah lewat ScheduleService::rescheduleSession (status RESCHEDULED).
 */
class RescheduleRequestService {

    // Sesi yang masih bisa dipindah
    public const MOVABLE_STATUSES = ['SCHEDULED', 'RESCHEDULED'];

    public function __construct(protected ScheduleService $scheduleService) {}

    public static function isMovable(ScheduleSession $session): bool {
        if (!in_array($session->status, self::MOVABLE_STATUSES, true)) return false;

        $start = Carbon::parse($session->session_date . ' ' . $session->start_time, LocalTime::TIMEZONE);
        return $start->isFuture();
    }

    /**
     * Ajukan pindah jadwal. $data: proposed_date, proposed_start_time (opsional: jam semula), reason, student_id (orang tua).
     */
    public function submit(ScheduleSession $session, string $requesterType, array $data): RescheduleRequest {
        if (!self::isMovable($session)) {
            throw ValidationException::withMessages(['session' => 'Sesi ini sudah berlangsung, selesai, atau dibatalkan sehingga tidak bisa dipindah.']);
        }

        $startTime = substr($data['proposed_start_time'] ?? $session->start_time, 0, 5);
        $duration = Carbon::parse($session->start_time)->diffInMinutes(Carbon::parse($session->end_time));
        $proposedStart = Carbon::parse($data['proposed_date'] . ' ' . $startTime, LocalTime::TIMEZONE);
        $proposedEnd = $proposedStart->copy()->addMinutes($duration);

        if (!$proposedStart->isFuture()) {
            throw ValidationException::withMessages(['proposed_date' => 'Jadwal pengganti harus setelah waktu sekarang.']);
        }
        if (!$proposedEnd->isSameDay($proposedStart)) {
            throw ValidationException::withMessages(['proposed_start_time' => 'Jam pengganti melewati tengah malam.']);
        }
        if ($proposedStart->toDateString() === $session->session_date && $startTime === substr($session->start_time, 0, 5)) {
            throw ValidationException::withMessages(['proposed_date' => 'Jadwal pengganti sama dengan jadwal semula.']);
        }

        // Tolak sejak awal bila jam usulan bentrok, agar pengaju bisa langsung memilih jam lain
        $conflicts = app(SessionConflictService::class)->find($session, $proposedStart->toDateString(), $proposedStart->format('H:i'), $proposedEnd->format('H:i'));
        if ($conflicts) {
            throw ValidationException::withMessages(['proposed_date' => 'Jadwal usulan bentrok: ' . implode(' ', $conflicts) . ' Pilih tanggal/jam lain.']);
        }

        $pending = RescheduleRequest::where('session_id', $session->id)
            ->where('requested_by', Auth::id())
            ->where('status', 'PENDING')
            ->exists();
        if ($pending) {
            throw ValidationException::withMessages(['session' => 'Anda sudah memiliki pengajuan yang menunggu keputusan untuk sesi ini.']);
        }

        return RescheduleRequest::create([
            'session_id'          => $session->id,
            'requested_by'        => Auth::id(),
            'requester_type'      => $requesterType,
            'student_id'          => $data['student_id'] ?? null,
            'original_date'       => $session->session_date,
            'original_start_time' => $session->start_time,
            'proposed_date'       => $proposedStart->toDateString(),
            'proposed_start_time' => $proposedStart->format('H:i'),
            'proposed_end_time'   => $proposedEnd->format('H:i'),
            'reason'              => trim($data['reason']),
            'status'              => 'PENDING',
        ]);
    }

    public function cancel(RescheduleRequest $request): RescheduleRequest {
        return DB::transaction(function () use ($request) {
            $request = RescheduleRequest::lockForUpdate()->findOrFail($request->id);
            $this->ensurePending($request);
            $request->update(['status' => 'CANCELLED']);
            return $request;
        });
    }

    /**
     * Setujui: pindahkan sesi. Admin boleh menyesuaikan tanggal/jam/tentor dari usulan.
     */
    public function approve(RescheduleRequest $request, array $data = []): RescheduleRequest {
        return DB::transaction(function () use ($request, $data) {
            $request = RescheduleRequest::lockForUpdate()->findOrFail($request->id);
            $this->ensurePending($request);

            $session = ScheduleSession::with('schedule')->lockForUpdate()->findOrFail($request->session_id);
            if (!self::isMovable($session)) {
                throw ValidationException::withMessages(['session' => 'Sesi sudah berlangsung, selesai, atau dibatalkan. Tolak pengajuan ini.']);
            }

            $target = [
                'session_date' => $data['session_date'] ?? $request->proposed_date,
                'start_time'   => substr($data['start_time'] ?? $request->proposed_start_time, 0, 5),
                'end_time'     => substr($data['end_time'] ?? $request->proposed_end_time, 0, 5),
                'tentor_id'    => $data['tentor_id'] ?? $session->tentor_id,
            ];

            if (!Carbon::parse($target['session_date'] . ' ' . $target['start_time'], LocalTime::TIMEZONE)->isFuture()) {
                throw ValidationException::withMessages(['session_date' => 'Jadwal baru harus setelah waktu sekarang.']);
            }

            // Dicek ulang saat disetujui: jadwal bisa berubah sejak pengajuan dikirim
            $check = $this->scheduleService->validateRescheduleSession($target + ['schedule_session_id' => $session->id]);
            if (!$check['success']) {
                throw ValidationException::withMessages(['session_date' => $check['message']]);
            }

            $result = $this->scheduleService->rescheduleSession($session, $target + [
                'reason' => $request->requester_type === 'PARENT' ? 'Permintaan orang tua' : 'Permintaan tentor',
                'note'   => $request->reason,
            ]);
            if (!$result['success']) {
                throw ValidationException::withMessages(['session' => $result['message']]);
            }

            $request->update([
                'status'      => 'APPROVED',
                'review_note' => $data['review_note'] ?? null,
                'reviewed_by' => Auth::id(),
                'reviewed_at' => now(),
                // Simpan jadwal yang benar-benar dipakai
                'proposed_date'       => $target['session_date'],
                'proposed_start_time' => $target['start_time'],
                'proposed_end_time'   => $target['end_time'],
            ]);

            // Pengajuan lain untuk sesi yang sama tidak relevan lagi
            RescheduleRequest::where('session_id', $session->id)
                ->where('status', 'PENDING')
                ->where('id', '!=', $request->id)
                ->update([
                    'status'      => 'REJECTED',
                    'review_note' => 'Sesi sudah dipindahkan berdasarkan pengajuan lain.',
                    'reviewed_by' => Auth::id(),
                    'reviewed_at' => now(),
                ]);

            return $request;
        });
    }

    public function reject(RescheduleRequest $request, string $note): RescheduleRequest {
        return DB::transaction(function () use ($request, $note) {
            $request = RescheduleRequest::lockForUpdate()->findOrFail($request->id);
            $this->ensurePending($request);
            $request->update([
                'status'      => 'REJECTED',
                'review_note' => trim($note),
                'reviewed_by' => Auth::id(),
                'reviewed_at' => now(),
            ]);
            return $request;
        });
    }

    private function ensurePending(RescheduleRequest $request): void {
        if ($request->status !== 'PENDING') {
            throw ValidationException::withMessages(['status' => 'Pengajuan ini sudah diproses.']);
        }
    }

    // Bentuk data untuk Admin / pengaju
    public static function present(RescheduleRequest $r): array {
        $session = $r->session;

        return [
            'id'             => $r->id,
            'status'         => $r->status,
            'requester_type' => $r->requester_type,
            'requester_name' => $r->requester?->name,
            'student_name'   => $r->student?->full_name,
            'session'        => $session ? [
                'id'           => $session->id,
                'class_name'   => $session->schedule?->classroom?->name,
                'subject_name' => $session->subject?->name,
                'tentor_name'  => $session->tentor?->user?->name,
                'tentor_id'    => $session->tentor_id,
                'session_date' => $session->session_date,
                'start_time'   => substr($session->start_time, 0, 5),
                'end_time'     => substr($session->end_time, 0, 5),
                'status'       => $session->status,
                'students_count' => $session->schedule?->classroom?->students_count,
            ] : null,
            'original_date'       => $r->original_date,
            'original_start_time' => substr($r->original_start_time, 0, 5),
            'proposed_date'       => $r->proposed_date,
            'proposed_start_time' => substr($r->proposed_start_time, 0, 5),
            'proposed_end_time'   => substr($r->proposed_end_time, 0, 5),
            'reason'              => $r->reason,
            'review_note'         => $r->review_note,
            // Pengecekan bentrok terkini untuk pengajuan yang masih menunggu
            'conflicts'           => $r->status === 'PENDING' && $session
                ? app(SessionConflictService::class)->find($session, $r->proposed_date, $r->proposed_start_time, $r->proposed_end_time)
                : [],
            'reviewer_name'       => $r->reviewer?->name,
            'reviewed_at'         => LocalTime::format($r->reviewed_at, 'Y-m-d H:i'),
            'created_at'          => LocalTime::format($r->created_at, 'Y-m-d H:i'),
        ];
    }

    // Relasi yang dibutuhkan present()
    public static function relations(): array {
        return [
            'session.schedule.classroom' => fn($q) => $q->withCount('students'),
            'session.subject', 'session.tentor.user', 'requester', 'student', 'reviewer',
        ];
    }
}
