<?php
namespace App\Services\Academic;

use App\Models\Academic\ScheduleSession;
use App\Models\Academic\TentorAttendance;

/**
 * Titik sasaran absen GPS tentor dan perhitungan jarak.
 *
 * Urutan sasaran: lokasi sementara disetujui Admin > rumah siswa (kelas PRIVATE) > lokasi sesi/jadwal/kelas.
 * Kelas ONLINE tidak memakai GPS. Absen di luar radius / di luar jam TETAP tercatat, hanya diberi keterangan.
 */
class AttendanceLocationService {

    // Toleransi jarak untuk rumah siswa & lokasi sementara; lokasi bimbel memakai radius_meter miliknya
    public const DEFAULT_RADIUS_METER = 100;

    // Jendela absen masuk: 30 menit sebelum jam mulai s/d jam selesai
    public const EARLY_CHECKIN_MINUTES = 30;

    // Absen pulang lebih dari 30 menit setelah jam selesai dianggap di luar jam
    public const LATE_CHECKOUT_MINUTES = 30;

    public const RELATIONS = [
        'schedule.classroom.location', 'schedule.classroom.students', 'schedule.location', 'location', 'approvedLocationChange',
    ];

    /**
     * @return array{type: string, label: string, address: ?string, latitude: ?float, longitude: ?float, radius_meter: ?int, requires_gps: bool}
     */
    public function resolveTarget(ScheduleSession $session): array {
        $session->loadMissing(self::RELATIONS);
        $classroom = $session->schedule?->classroom;
        $classType = strtoupper($classroom->class_type ?? 'REGULER');

        if ($classType === 'ONLINE') {
            return $this->target('ONLINE', 'Kelas online', null, null, null, null, false);
        }

        if ($change = $session->approvedLocationChange) {
            return $this->target('TEMPORARY', "Lokasi sementara: {$change->location_name}", $change->address,
                $change->latitude, $change->longitude, self::DEFAULT_RADIUS_METER);
        }

        if ($classType === 'PRIVATE') {
            $students = $classroom?->students ?? collect();
            $home = $students->first(fn($s) => $s->home_latitude !== null && $s->home_longitude !== null);
            if ($home) {
                return $this->target('HOME', "Rumah {$home->full_name}", $home->home_address,
                    $home->home_latitude, $home->home_longitude, self::DEFAULT_RADIUS_METER);
            }
            $name = $students->first()?->full_name;
            return $this->target('HOME', $name ? "Rumah {$name} (titik belum diatur)" : 'Rumah siswa (titik belum diatur)',
                $students->first()?->home_address, null, null, null);
        }

        $location = $session->location ?? $session->schedule?->location ?? $classroom?->location;
        if ($location && $location->latitude !== null && $location->longitude !== null) {
            return $this->target('BIMBEL', $location->location_name, $location->address,
                $location->latitude, $location->longitude, $location->radius_meter ?: self::DEFAULT_RADIUS_METER);
        }

        return $this->target('BIMBEL', $location ? "{$location->location_name} (titik belum diatur)" : 'Lokasi belum diatur',
            $location?->address, null, null, null);
    }

    /**
     * Jarak & status area. $position: latitude, longitude, accuracy (opsional).
     * Tanpa titik sasaran, jarak tidak dihitung dan tidak dianggap di luar area.
     */
    public function measure(array $target, array $position): array {
        $lat = $position['latitude'] ?? null;
        $lng = $position['longitude'] ?? null;
        $hasPosition = $lat !== null && $lng !== null;
        $hasTarget = $target['latitude'] !== null && $target['longitude'] !== null;

        $distance = $hasPosition && $hasTarget
            ? (int) round($this->distanceMeter($lat, $lng, $target['latitude'], $target['longitude']))
            : null;

        return [
            'latitude'        => $hasPosition ? (float) $lat : null,
            'longitude'       => $hasPosition ? (float) $lng : null,
            'accuracy_meter'  => isset($position['accuracy']) ? (int) round($position['accuracy']) : null,
            'distance_meter'  => $distance,
            'outside_area'    => $distance !== null && $distance > $target['radius_meter'],
        ];
    }

    // Rumus haversine, hasil dalam meter
    public function distanceMeter(float $lat1, float $lng1, float $lat2, float $lng2): float {
        $earth = 6371000;
        $dLat = deg2rad($lat2 - $lat1);
        $dLng = deg2rad($lng2 - $lng1);
        $a = sin($dLat / 2) ** 2 + cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * sin($dLng / 2) ** 2;
        return $earth * 2 * atan2(sqrt($a), sqrt(1 - $a));
    }

    /**
     * Keterangan absensi tentor untuk ditampilkan (Admin, tentor, Android).
     */
    public static function remarks(?TentorAttendance $log): array {
        if (!$log || $log->attendance_status !== 'HADIR') return [];

        $notes = [];
        if ($log->checkin_source === 'ADMIN') $notes[] = 'Diinput Admin';
        if ($log->checkin_outside_area) $notes[] = "Masuk di luar lokasi (±{$log->checkin_distance_meter} m)";
        if ($log->checkin_outside_time) $notes[] = 'Masuk di luar jam';
        if ($log->late_minutes > 0) $notes[] = "Terlambat {$log->late_minutes} mnt";
        if ($log->checked_out_at) {
            if ($log->checkout_outside_area) $notes[] = "Pulang di luar lokasi (±{$log->checkout_distance_meter} m)";
            if ($log->early_leave_minutes > 0) $notes[] = "Pulang lebih awal {$log->early_leave_minutes} mnt";
            if ($log->checkout_outside_time) $notes[] = 'Pulang di luar jam';
        }

        return $notes;
    }

    // Detail lokasi absensi untuk tampilan Admin / tentor
    public static function presentLocation(?TentorAttendance $log): ?array {
        if (!$log) return null;

        return [
            'target_label'            => $log->target_label,
            'target_latitude'         => $log->target_latitude,
            'target_longitude'        => $log->target_longitude,
            'target_radius_meter'     => $log->target_radius_meter,
            'checkin_latitude'        => $log->checkin_latitude,
            'checkin_longitude'       => $log->checkin_longitude,
            'checkin_accuracy_meter'  => $log->checkin_accuracy_meter,
            'checkin_distance_meter'  => $log->checkin_distance_meter,
            'checkin_outside_area'    => (bool) $log->checkin_outside_area,
            'checkin_outside_time'    => (bool) $log->checkin_outside_time,
            'checkout_latitude'       => $log->checkout_latitude,
            'checkout_longitude'      => $log->checkout_longitude,
            'checkout_accuracy_meter' => $log->checkout_accuracy_meter,
            'checkout_distance_meter' => $log->checkout_distance_meter,
            'checkout_outside_area'   => (bool) $log->checkout_outside_area,
            'checkout_outside_time'   => (bool) $log->checkout_outside_time,
            'early_leave_minutes'     => (int) $log->early_leave_minutes,
            'checkin_source'          => $log->checkin_source,
        ];
    }

    private function target(string $type, string $label, ?string $address, ?float $lat, ?float $lng, ?int $radius, bool $requiresGps = true): array {
        return [
            'type'         => $type,
            'label'        => $label,
            'address'      => $address,
            'latitude'     => $lat,
            'longitude'    => $lng,
            'radius_meter' => $lat !== null ? $radius : null,
            'requires_gps' => $requiresGps,
        ];
    }
}
