<?php
namespace App\Services\Academic;

use App\Models\Academic\ClassStudent;
use App\Models\Academic\ScheduleSession;
use Illuminate\Support\Collection;

/**
 * Pengecekan bentrok bila sebuah sesi dipindah ke tanggal/jam lain. Dipakai saat
 * pengajuan pindah jadwal (orang tua/tentor), saat Admin meninjau, menyetujui, dan memindah langsung.
 *
 * Aturan: (1) tentor sama, (2) sesi lain di kelas yang sama, (3) siswa kelas ini di kelas lain,
 * (4) ruang yang sama di gedung yang sama (kelas REGULER yang ruangnya diisi).
 */
class SessionConflictService {

    /**
     * @return list<string> pesan bentrok; kosong berarti aman
     */
    public function find(ScheduleSession $session, string $date, string $start, string $end, ?string $tentorId = null): array {
        $session->loadMissing(['schedule.classroom']);
        $tentorId ??= $session->tentor_id;
        $classId = $session->schedule?->class_id;
        $start = substr($start, 0, 5);
        $end = substr($end, 0, 5);

        // Sesi lain yang beririsan waktunya pada tanggal tujuan
        $overlapping = ScheduleSession::with(['schedule.classroom', 'subject', 'tentor.user'])
            ->whereDate('session_date', $date)
            ->where('id', '!=', $session->id)
            ->where('status', '!=', 'CANCELLED')
            ->whereTime('start_time', '<', $end)
            ->whereTime('end_time', '>', $start)
            ->get();

        $messages = [];
        $describe = fn(ScheduleSession $s) => trim(($s->subject?->name ?? 'Sesi') . ' di ' . ($s->schedule?->classroom?->name ?? 'kelas lain'))
            . ' (' . substr($s->start_time, 0, 5) . '-' . substr($s->end_time, 0, 5) . ')';

        // 1. Tentor sudah mengajar di jam itu
        if ($hit = $overlapping->firstWhere('tentor_id', $tentorId)) {
            $messages[] = 'Tentor ' . ($hit->tentor?->user?->name ?? '') . " sudah mengajar {$describe($hit)}.";
        }

        // 2. Kelas yang sama sudah punya sesi lain di jam itu (mapel/tentor berbeda)
        if ($classId && ($hit = $overlapping->first(fn($s) => $s->schedule?->class_id === $classId && $s->tentor_id !== $tentorId))) {
            $messages[] = "Kelas ini sudah ada sesi {$describe($hit)}.";
        }

        // 3. Siswa kelas ini punya sesi di kelas lain pada jam itu
        if ($classId) {
            $studentIds = ClassStudent::where('class_id', $classId)->pluck('student_id');
            $otherClassIds = $studentIds->isEmpty() ? collect() : ClassStudent::whereIn('student_id', $studentIds)
                ->where('class_id', '!=', $classId)->pluck('class_id')->unique();
            if ($hit = $overlapping->first(fn($s) => $otherClassIds->contains($s->schedule?->class_id))) {
                $messages[] = "Sebagian siswa sudah punya sesi {$describe($hit)}.";
            }
        }

        // 4. Ruang yang sama di gedung yang sama (hanya kelas reguler dengan nama ruang)
        $room = $this->roomOf($session);
        if ($room && ($hit = $overlapping->first(fn($s) => $this->roomOf($s) === $room))) {
            $messages[] = 'Ruang ' . trim((string) ($session->room_name ?: $session->schedule?->room_name)) . " di gedung yang sama sudah dipakai {$describe($hit)}.";
        }

        return $messages;
    }

    // "<lokasi>|<ruang>" untuk sesi reguler yang ruangnya diisi; null bila tidak relevan
    private function roomOf(ScheduleSession $s): ?string {
        $s->loadMissing(['schedule.classroom']);
        if (strtoupper($s->schedule?->classroom?->class_type ?? 'REGULER') !== 'REGULER') return null;

        $room = trim((string) ($s->room_name ?: $s->schedule?->room_name));
        $location = $s->location_id ?: ($s->schedule?->learning_location_id ?: $s->schedule?->classroom?->learning_location_id);
        return $room !== '' && $location ? $location . '|' . mb_strtolower($room) : null;
    }
}
