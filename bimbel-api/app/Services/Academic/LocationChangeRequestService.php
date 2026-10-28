<?php
namespace App\Services\Academic;

use App\Models\Academic\LocationChangeRequest;
use App\Models\Academic\ScheduleSession;
use App\Support\LocalTime;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Pengajuan pindah lokasi les sementara per sesi oleh tentor / orang tua, diputuskan Admin.
 * Disetujui -> lokasi itu menjadi titik absen GPS tentor untuk sesi tersebut.
 */
class LocationChangeRequestService {

    // Sesi yang lokasinya masih bisa diubah (belum dimulai)
    public const OPEN_STATUSES = ['SCHEDULED', 'PREPARING', 'RESCHEDULED'];

    public static function canRequest(ScheduleSession $session): bool {
        if (!in_array($session->status, self::OPEN_STATUSES, true)) return false;

        $session->loadMissing('schedule.classroom');
        if (strtoupper($session->schedule?->classroom?->class_type ?? '') === 'ONLINE') return false;

        $end = Carbon::parse($session->session_date . ' ' . $session->end_time, LocalTime::TIMEZONE);
        return $end->isFuture();
    }

    /**
     * $data: location_name, address, latitude, longitude, reason, student_id (orang tua).
     */
    public function submit(ScheduleSession $session, string $requesterType, array $data): LocationChangeRequest {
        if (!self::canRequest($session)) {
            throw ValidationException::withMessages(['session' => 'Lokasi sesi ini tidak bisa diubah (kelas online, sudah dimulai, selesai, atau dibatalkan).']);
        }

        $pending = LocationChangeRequest::where('session_id', $session->id)
            ->where('requested_by', Auth::id())
            ->where('status', 'PENDING')
            ->exists();
        if ($pending) {
            throw ValidationException::withMessages(['session' => 'Anda sudah memiliki pengajuan lokasi yang menunggu keputusan untuk sesi ini.']);
        }

        return LocationChangeRequest::create([
            'session_id'     => $session->id,
            'requested_by'   => Auth::id(),
            'requester_type' => $requesterType,
            'student_id'     => $data['student_id'] ?? null,
            'location_name'  => trim($data['location_name']),
            'address'        => trim($data['address']),
            'latitude'       => $data['latitude'],
            'longitude'      => $data['longitude'],
            'reason'         => trim($data['reason']),
            'status'         => 'PENDING',
        ]);
    }

    public function cancel(LocationChangeRequest $request): LocationChangeRequest {
        return DB::transaction(function () use ($request) {
            $request = LocationChangeRequest::lockForUpdate()->findOrFail($request->id);
            $this->ensurePending($request);
            $request->update(['status' => 'CANCELLED']);
            return $request;
        });
    }

    public function approve(LocationChangeRequest $request, ?string $note = null): LocationChangeRequest {
        return DB::transaction(function () use ($request, $note) {
            $request = LocationChangeRequest::lockForUpdate()->findOrFail($request->id);
            $this->ensurePending($request);

            $session = ScheduleSession::lockForUpdate()->findOrFail($request->session_id);
            if (!self::canRequest($session)) {
                throw ValidationException::withMessages(['session' => 'Sesi sudah dimulai, selesai, atau dibatalkan. Tolak pengajuan ini.']);
            }

            $request->update([
                'status'      => 'APPROVED',
                'review_note' => $note ? trim($note) : null,
                'reviewed_by' => Auth::id(),
                'reviewed_at' => now(),
            ]);

            // Pengajuan lain untuk sesi yang sama tidak relevan lagi
            LocationChangeRequest::where('session_id', $session->id)
                ->where('status', 'PENDING')
                ->where('id', '!=', $request->id)
                ->update([
                    'status'      => 'REJECTED',
                    'review_note' => 'Lokasi sesi sudah ditetapkan berdasarkan pengajuan lain.',
                    'reviewed_by' => Auth::id(),
                    'reviewed_at' => now(),
                ]);

            return $request;
        });
    }

    public function reject(LocationChangeRequest $request, string $note): LocationChangeRequest {
        return DB::transaction(function () use ($request, $note) {
            $request = LocationChangeRequest::lockForUpdate()->findOrFail($request->id);
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

    private function ensurePending(LocationChangeRequest $request): void {
        if ($request->status !== 'PENDING') {
            throw ValidationException::withMessages(['status' => 'Pengajuan ini sudah diproses.']);
        }
    }

    // Bentuk data untuk Admin / pengaju
    public static function present(LocationChangeRequest $r): array {
        $session = $r->session;
        $target = $session ? app(AttendanceLocationService::class)->resolveTarget($session) : null;

        return [
            'id'             => $r->id,
            'status'         => $r->status,
            'requester_type' => $r->requester_type,
            'requester_name' => $r->requester?->name,
            'student_name'   => $r->student?->full_name,
            'session'        => $session ? [
                'id'           => $session->id,
                'class_name'   => $session->schedule?->classroom?->name,
                'class_type'   => $session->schedule?->classroom?->class_type,
                'subject_name' => $session->subject?->name,
                'tentor_name'  => $session->tentor?->user?->name,
                'session_date' => $session->session_date,
                'start_time'   => substr($session->start_time, 0, 5),
                'end_time'     => substr($session->end_time, 0, 5),
                'status'       => $session->status,
                // Lokasi yang berlaku sekarang (sebelum pengajuan ini disetujui)
                'current_location' => $target && $r->status === 'PENDING' ? $target['label'] : null,
            ] : null,
            'location_name'  => $r->location_name,
            'address'        => $r->address,
            'latitude'       => $r->latitude,
            'longitude'      => $r->longitude,
            'reason'         => $r->reason,
            'review_note'    => $r->review_note,
            'reviewer_name'  => $r->reviewer?->name,
            'reviewed_at'    => LocalTime::format($r->reviewed_at, 'Y-m-d H:i'),
            'created_at'     => LocalTime::format($r->created_at, 'Y-m-d H:i'),
            'can_approve'    => $r->status === 'PENDING' && $session && self::canRequest($session),
        ];
    }

    // Relasi yang dibutuhkan present()
    public static function relations(): array {
        return array_merge(
            ['session.subject', 'session.tentor.user', 'requester', 'student', 'reviewer'],
            array_map(fn($rel) => "session.{$rel}", AttendanceLocationService::RELATIONS),
        );
    }
}
