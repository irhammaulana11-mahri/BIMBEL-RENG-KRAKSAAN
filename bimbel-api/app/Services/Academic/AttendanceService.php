<?php
namespace App\Services\Academic;

use App\Models\Academic\ScheduleSession;
use App\Models\Academic\StudentAttendance;
use App\Models\Academic\TentorAttendance;
use App\Http\Resources\Academic\TentorAttendanceResource;
use App\Http\Resources\Academic\StudentAttendanceSessionResource;
use App\Support\LocalTime;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class AttendanceService {

    // Jam sesi (session_date + start_time) ditulis dalam waktu lokal bimbel
    public const TIMEZONE = LocalTime::TIMEZONE;

    public function __construct(protected AttendanceLocationService $locationService, protected AttendanceLock $lock) {}

    /**
     * Mengambil daftar siswa kelas beserta status absennya di sesi ini
     */
    public function getStudentAttendanceForm(ScheduleSession $session): array {
        $session->loadMissing(['schedule.classroom.students.user', 'subject', 'tentor.user', 'studentAttendances']);

        return [
            'success' => true,
            'session' => [
                'id'           => $session->id,
                'subject_name' => $session->subject->name ?? '-',
                'class_name'   => $session->schedule->classroom->name ?? '-',
                'session_date' => $session->session_date,
                'start_time'   => substr($session->start_time, 0, 5),
                'end_time'     => substr($session->end_time, 0, 5),
                'status'       => $session->status,
                'tentor_name'  => $session->tentor->user->name ?? '-',
            ],
            // Siswa yang absensinya terkunci tagihan/payroll hanya bisa diubah lewat koreksi
            'students' => $this->mapStudentsWithAttendance($session)
                ->map(fn($s) => $s + ['locked_reason' => $this->lock->reason($session, $s['student_id'])]),
        ];
    }

    /**
     * Daftar siswa kelas + status absensi sesi. Dipakai juga oleh Workspace Tentor.
     */
    public function mapStudentsWithAttendance(ScheduleSession $session) {
        $enrolledStudents = $session->schedule->classroom->students ?? collect();
        $existingAttendances = $session->studentAttendances->keyBy('student_id');

        return $enrolledStudents->map(function($student) use ($existingAttendances) {
            $attendance = $existingAttendances->get($student->id);
            return [
                'id'                => $student->id,
                'student_id'        => $student->id,
                'student_name'      => $student->user->name ?? $student->full_name,
                'full_name'         => $student->full_name ?? $student->user->name ?? '-',
                'school_name'       => $student->school_name ?? '-',
                'nis'               => $student->nis ?? '-',
                'attendance_status' => $attendance ? $attendance->attendance_status : 'BELUM',
                'note'              => $attendance ? $attendance->note : '',
            ];
        })->values();
    }

    /**
     * Simpan Absensi Siswa secara massal.
     * Tidak mengubah status sesi; sesi diselesaikan lewat endSession().
     */
    public function saveBulkStudentAttendance(ScheduleSession $session, array $data): array {
        if ($session->status === 'CANCELLED') {
            return ['success' => false, 'code' => 422, 'message' => 'Sesi yang dibatalkan tidak dapat diabsen.'];
        }

        $enrolledIds = $session->schedule->classroom
            ? $session->schedule->classroom->students()->pluck('master.students.id')->all()
            : [];

        $invalidIds = collect($data['attendances'])->pluck('student_id')->diff($enrolledIds);
        if ($invalidIds->isNotEmpty()) {
            return ['success' => false, 'code' => 422, 'message' => 'Terdapat siswa yang bukan peserta kelas sesi ini.'];
        }

        // Absensi yang sudah terkunci tagihan/payroll tidak boleh diubah langsung (D-01)
        $existing = $session->studentAttendances()->get()->keyBy('student_id');
        $locked = collect($data['attendances'])
            ->filter(fn($item) => $item['attendance_status'] !== ($existing->get($item['student_id'])?->attendance_status ?? 'BELUM'))
            ->map(fn($item) => ($reason = $this->lock->reason($session, $item['student_id'])) ? [$item['student_id'], $reason] : null)
            ->filter();
        if ($locked->isNotEmpty()) {
            $names = $session->schedule->classroom->students()->whereIn('master.students.id', $locked->pluck(0))->pluck('full_name')->join(', ');
            return ['success' => false, 'code' => 422, 'locked' => true,
                'message' => "Absensi {$names} terkunci karena {$locked->first()[1]}. Ajukan koreksi absensi untuk mengubahnya."];
        }

        try {
            DB::beginTransaction();
            $now = now();

            foreach ($data['attendances'] as $item) {
                $status = $item['attendance_status'];
                $record = $existing->get($item['student_id']);

                if ($status === 'BELUM') {
                    $record?->delete();
                    continue;
                }

                // Pertahankan jam check-in lama jika siswa sebelumnya sudah HADIR
                $checkedInAt = $status === 'HADIR'
                    ? ($record && $record->attendance_status === 'HADIR' && $record->checked_in_at ? $record->checked_in_at : $now)
                    : null;

                StudentAttendance::updateOrCreate(
                    [
                        'session_id' => $session->id,
                        'student_id' => $item['student_id']
                    ],
                    [
                        'attendance_status' => $status,
                        'note'              => $status === 'HADIR' ? null : ($item['note'] ?? null),
                        'checked_in_at'     => $checkedInAt,
                    ]
                );
            }

            DB::commit();
            return ['success' => true, 'message' => 'Absensi siswa berhasil disimpan.'];
        } catch (\Throwable $e) {
            DB::rollBack();
            // Detail teknis (SQL dsb.) hanya di log, tidak dikirim ke klien (LOW-01)
            Log::error('Gagal menyimpan absensi siswa', ['session_id' => $session->id, 'exception' => $e]);
            return ['success' => false, 'code' => 500, 'message' => 'Gagal menyimpan absensi. Coba lagi atau hubungi admin.'];
        }
    }

    /**
     * Absen masuk tentor saat sesi dimulai, dengan posisi GPS. Tidak menimpa check-in yang sudah ada.
     * $position: latitude, longitude, accuracy (kosong untuk kelas online / pemanggilan tanpa GPS).
     */
    public function checkInTentor(ScheduleSession $session, array $position = [], ?string $source = null): TentorAttendance {
        $attendance = TentorAttendance::firstOrNew([
            'session_id' => $session->id,
            'tentor_id'  => $session->tentor_id,
        ]);

        if (!$attendance->exists || !$attendance->checked_in_at) {
            $now = now();
            $target = $this->locationService->resolveTarget($session);
            $measured = $this->locationService->measure($target, $position);

            $attendance->fill([
                'attendance_status'      => 'HADIR',
                'checked_in_at'          => $now,
                'late_minutes'           => $this->calculateLateMinutes($session, $now),
                'target_label'           => $target['label'],
                'target_latitude'        => $target['latitude'],
                'target_longitude'       => $target['longitude'],
                'target_radius_meter'    => $target['radius_meter'],
                'checkin_latitude'       => $measured['latitude'],
                'checkin_longitude'      => $measured['longitude'],
                'checkin_accuracy_meter' => $measured['accuracy_meter'],
                'checkin_distance_meter' => $measured['distance_meter'],
                'checkin_outside_area'   => $measured['outside_area'],
                'checkin_outside_time'   => $this->isOutsideCheckinWindow($session, $now),
                'checkin_source'         => $source,
            ])->save();
        }

        return $attendance;
    }

    /**
     * Absen pulang tentor saat sesi diselesaikan: posisi GPS, durasi mengajar, pulang awal / di luar jam.
     */
    public function checkOutTentor(ScheduleSession $session, array $position = [], ?string $source = null): TentorAttendance {
        $attendance = $this->checkInTentor($session, $position, $source);

        if (!$attendance->checked_out_at) {
            $now = now();
            // Bandingkan dengan titik sasaran yang dibekukan saat absen masuk
            $measured = $this->locationService->measure([
                'latitude'     => $attendance->target_latitude,
                'longitude'    => $attendance->target_longitude,
                'radius_meter' => $attendance->target_radius_meter,
            ], $position);

            $attendance->update([
                'checked_out_at'          => $now,
                'teaching_minutes'        => $this->calculateTeachingMinutes($attendance->checked_in_at, $now),
                'checkout_latitude'       => $measured['latitude'],
                'checkout_longitude'      => $measured['longitude'],
                'checkout_accuracy_meter' => $measured['accuracy_meter'],
                'checkout_distance_meter' => $measured['distance_meter'],
                'checkout_outside_area'   => $measured['outside_area'],
                'early_leave_minutes'     => $this->calculateEarlyLeaveMinutes($session, $now),
                'checkout_outside_time'   => $this->isOutsideCheckoutWindow($session, $now),
            ]);
        }

        return $attendance;
    }

    /**
     * Koreksi / input manual absensi tentor oleh Admin.
     */
    public function saveTentorAttendance(ScheduleSession $session, array $data): array {
        if (!$session->tentor_id) {
            return ['success' => false, 'code' => 422, 'message' => 'Sesi ini belum memiliki tentor.'];
        }

        $attendance = TentorAttendance::firstOrNew([
            'session_id' => $session->id,
            'tentor_id'  => $session->tentor_id,
        ]);

        if ($attendance->is_payroll_processed) {
            return ['success' => false, 'code' => 422, 'message' => 'Absensi sudah diproses payroll dan tidak dapat diubah.'];
        }

        $isPresent = $data['attendance_status'] === 'HADIR';
        $checkedInAt = $isPresent ? $this->sessionDateTime($session, $data['checkin_time']) : null;
        $checkedOutAt = $isPresent && !empty($data['checkout_time'])
            ? $this->sessionDateTime($session, $data['checkout_time'])
            : null;

        $attendance->fill([
            'attendance_status' => $data['attendance_status'],
            'checked_in_at'     => $checkedInAt,
            'checked_out_at'    => $checkedOutAt,
            'late_minutes'      => $checkedInAt ? $this->calculateLateMinutes($session, $checkedInAt) : 0,
            'teaching_minutes'  => $checkedOutAt ? $this->calculateTeachingMinutes($checkedInAt, $checkedOutAt) : 0,
            'note'              => $data['note'] ?? null,
            'checkin_source'    => 'ADMIN',
            // Keterangan jam mengikuti jam koreksi; keterangan lokasi GPS tentor (jika ada) dipertahankan
            'checkin_outside_time'  => $checkedInAt ? $this->isOutsideCheckinWindow($session, $checkedInAt) : false,
            'early_leave_minutes'   => $checkedOutAt ? $this->calculateEarlyLeaveMinutes($session, $checkedOutAt) : 0,
            'checkout_outside_time' => $checkedOutAt ? $this->isOutsideCheckoutWindow($session, $checkedOutAt) : false,
        ])->save();

        $session->setRelation('tentorAttendance', $attendance);

        return [
            'success' => true,
            'message' => 'Absensi tentor berhasil disimpan.',
            'data'    => new TentorAttendanceResource($this->withAttendanceSummary(ScheduleSession::whereKey($session->id))->first()),
        ];
    }

    public function getTentorAttendances(array $filters) {
        $query = $this->withAttendanceSummary(ScheduleSession::query());
        $this->applySessionFilters($query, $filters);

        // Urutkan berdasarkan tanggal dan waktu
        $sessions = $query->orderBy('session_date', 'desc')
                          ->orderBy('start_time', 'asc')
                          ->get();

        return TentorAttendanceResource::collection($sessions);
    }

    public function getStudentSessions(array $filters) {
        $query = $this->withAttendanceSummary(ScheduleSession::query());
        $this->applySessionFilters($query, $filters);

        // Filter Status Absensi
        if (!empty($filters['status'])) {
            if ($filters['status'] === 'SELESAI') {
                $query->has('studentAttendances');
            } elseif ($filters['status'] === 'BELUM') {
                $query->doesntHave('studentAttendances');
            }
        }

        $sessions = $query->orderBy('session_date', 'desc')->orderBy('start_time', 'asc')->get();
        return StudentAttendanceSessionResource::collection($sessions);
    }

    /**
     * Eager load + hitungan agregat untuk list absensi (menghindari N+1 query)
     */
    public function withAttendanceSummary(Builder $query): Builder {
        return $query->with([
                'schedule.classroom' => fn($q) => $q->withCount('students'),
                'subject', 'tentor.user', 'tentorAttendance',
            ])
            ->withCount([
                'studentAttendances',
                'studentAttendances as present_count' => fn($q) => $q->where('attendance_status', 'HADIR'),
            ]);
    }

    private function applySessionFilters(Builder $query, array $filters): void {
        // Filter Waktu (Harian / Bulanan)
        $mode = $filters['filter_mode'] ?? 'harian';
        if ($mode === 'harian' && !empty($filters['date'])) {
            $query->whereDate('session_date', $filters['date']);
        } elseif ($mode === 'bulanan' && !empty($filters['month'])) {
            $year = substr($filters['month'], 0, 4);
            $month = substr($filters['month'], 5, 2);
            $query->whereYear('session_date', $year)->whereMonth('session_date', $month);
        }

        // Filter Keyword (Pencarian Kelas, Mapel, Tentor)
        if (!empty($filters['keyword'])) {
            $kw = strtolower($filters['keyword']);
            $query->where(function($q) use ($kw) {
                $q->whereHas('tentor.user', fn($q) => $q->whereRaw('LOWER(name) LIKE ?', ["%{$kw}%"]))
                  ->orWhereHas('subject', fn($q) => $q->whereRaw('LOWER(name) LIKE ?', ["%{$kw}%"]))
                  ->orWhereHas('schedule.classroom', fn($q) => $q->whereRaw('LOWER(name) LIKE ?', ["%{$kw}%"]));
            });
        }
    }

    /**
     * Gabungkan tanggal sesi dengan jam (HH:MM) waktu lokal, hasil dalam timezone aplikasi.
     */
    private function sessionDateTime(ScheduleSession $session, string $time): Carbon {
        $date = Carbon::parse($session->session_date)->format('Y-m-d');
        return Carbon::parse("{$date} " . substr($time, 0, 5), self::TIMEZONE)
            ->setTimezone(config('app.timezone'));
    }

    private function calculateLateMinutes(ScheduleSession $session, Carbon $checkedInAt): int {
        $scheduledStart = $this->sessionDateTime($session, $session->start_time);
        return $checkedInAt->greaterThan($scheduledStart)
            ? (int) $scheduledStart->diffInMinutes($checkedInAt)
            : 0;
    }

    // Di luar jendela absen masuk: lebih awal dari 30 menit sebelum mulai, atau setelah jam selesai
    private function isOutsideCheckinWindow(ScheduleSession $session, Carbon $at): bool {
        $windowStart = $this->sessionDateTime($session, $session->start_time)
            ->subMinutes(AttendanceLocationService::EARLY_CHECKIN_MINUTES);
        return $at->lessThan($windowStart) || $at->greaterThan($this->sessionDateTime($session, $session->end_time));
    }

    private function isOutsideCheckoutWindow(ScheduleSession $session, Carbon $at): bool {
        $windowEnd = $this->sessionDateTime($session, $session->end_time)
            ->addMinutes(AttendanceLocationService::LATE_CHECKOUT_MINUTES);
        return $at->greaterThan($windowEnd);
    }

    private function calculateEarlyLeaveMinutes(ScheduleSession $session, Carbon $checkedOutAt): int {
        $scheduledEnd = $this->sessionDateTime($session, $session->end_time);
        return $checkedOutAt->lessThan($scheduledEnd) ? (int) $checkedOutAt->diffInMinutes($scheduledEnd) : 0;
    }

    private function calculateTeachingMinutes(?Carbon $checkedInAt, Carbon $checkedOutAt): int {
        if (!$checkedInAt || $checkedOutAt->lessThanOrEqualTo($checkedInAt)) return 0;
        return (int) $checkedInAt->diffInMinutes($checkedOutAt);
    }
}
