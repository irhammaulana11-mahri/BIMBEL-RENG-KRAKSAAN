<?php

namespace App\Services\Academic;

use App\Models\Academic\Schedule;
use App\Models\Academic\ScheduleSession;
use App\Models\Academic\ClassRoom;
use App\Models\Academic\LearningLocation;
use App\Models\Admin\Student;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Carbon\Carbon;
use Throwable;


class ScheduleService {
    /**
     * --------------------------------------------------------------------------
     * Status Slot Constants
     * --------------------------------------------------------------------------
     */
    public const STATUS_FREE = 'FREE';
    public const STATUS_OCCUPIED = 'OCCUPIED';
    public const STATUS_CONFLICT = 'CONFLICT';

    /**
     * Eager loading relations default.
     */
    protected array $relations = [
        'classroom',
        'subject',
        'tentor.user',
        'location',
    ];

    /*
    |--------------------------------------------------------------------------
    | PUBLIC METHODS (PUBLIC API)
    |--------------------------------------------------------------------------
    */

    /**
     * Mengambil kalender ketersediaan slot (Availability Calendar).
     *
     * @param Request $request
     * @return array Response JSON-ready
     */
    public function availability(Request $request): array {
        try {
            $tentorId = $request->input('tentor_id');
            $classroomId = $request->input('classroom_id');
            $locationId = $request->input('location_id');
            $excludeScheduleId = $request->input('exclude_schedule_id');

            $schedules = $this->scheduleQuery()
                ->when($excludeScheduleId, fn (Builder $q) => $q->where('id', '!=', $excludeScheduleId))
                ->get();

            $scheduleIndex = $this->buildScheduleIndex(
                schedules: $schedules,
                tentorId: $tentorId,
                classroomId: $classroomId,
                locationId: $locationId
            );

            return $this->generateCalendar($scheduleIndex);
        } catch (Throwable $e) {
            return $this->handleException('Gagal memuat ketersediaan jadwal.', $e);
        }
    }


    public function getSessions(array $filters, int $perPage = 15): LengthAwarePaginator {
        // Relasi lokasi lengkap agar label lokasi mengikuti jenis kelas (online / rumah siswa / gedung)
        $query = ScheduleSession::with(array_merge(
            ['subject', 'tentor.user', 'schedule.classroom' => fn($q) => $q->withCount('students')],
            AttendanceLocationService::RELATIONS
        ))->withCount(['studentAttendances as present_count' => fn($q) => $q->where('attendance_status', 'HADIR')]);

        if (!empty($filters['keyword'])) {
            $keyword = trim($filters['keyword']);
            $query->where(function ($q) use ($keyword) {
                $q->where('room_name', 'ILIKE', "%{$keyword}%")
                  ->orWhereHas('schedule.classroom', function ($classroom) use ($keyword) {
                      $classroom->where('name', 'ILIKE', "%{$keyword}%");
                  })
                  ->orWhereHas('subject', function ($subject) use ($keyword) {
                      $subject->where('name', 'ILIKE', "%{$keyword}%");
                  })
                  ->orWhereHas('tentor.user', function ($user) use ($keyword) {
                      $user->where('name', 'ILIKE', "%{$keyword}%");
                  })
                  ->orWhereHas('location', function ($location) use ($keyword) {
                      $location->where('location_name', 'ILIKE', "%{$keyword}%");
                  });
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        
        // if (!empty($filters['date'])) {
        //     $query->whereDate('session_date', $filters['date']);
        // }

        return $query->orderBy('session_date', 'asc')
                     ->orderBy('start_time', 'asc')
                     ->paginate($perPage);
    }

    /**
     * Membuat jadwal Master (Single) sekaligus me-generate N sesi pertemuannya.
     *
     * @param array $data
     * @return array
     */
    public function generateScheduleAndSessions(array $data): array {
        try {
            DB::beginTransaction();

            // 1. Buat Master Schedule
            $schedule = Schedule::create([
                'class_id'             => $data['class_id'],
                'subject_id'           => $data['subject_id'],
                'tentor_id'            => $data['tentor_id'],
                'learning_location_id' => $data['learning_location_id'] ?? null,
                'day_of_week'          => $data['day_of_week'],
                'start_time'           => $data['start_time'],
                'end_time'             => $data['end_time'],
                'room_name'            => $data['room_name'] ?? null,
                'meeting_url'          => $data['meeting_url'] ?? null,
                'is_active'            => true,
            ]);

            // 2. Insert Schedule Students
            $class = ClassRoom::with('students')->find($data['class_id']);
            $studentIds = $class ? $class->students->pluck('id')->toArray() : [];
            if (!empty($studentIds)) {
                $schedule->students()->sync($studentIds);
            }

            // 3. Generator Sessions (Looping)
            $sessions = [];
            $currentDate = Carbon::parse($data['start_date']);
            
            if ($currentDate->dayOfWeekIso % 7 != $data['day_of_week']) {
                 $currentDate->next($data['day_of_week']);
            }

            $now = now();
            for ($i = 1; $i <= $data['meeting_target']; $i++) {
                $sessions[] = [
                    'id'           => Str::uuid(),
                    'schedule_id'  => $schedule->id,
                    'subject_id'   => $data['subject_id'],
                    'tentor_id'    => $data['tentor_id'],
                    'location_id'  => $data['learning_location_id'] ?? null,
                    'meeting_no'   => $i,
                    'session_date' => $currentDate->format('Y-m-d'),
                    'day_of_week'  => $data['day_of_week'],
                    'start_time'   => $data['start_time'] . ':00',
                    'end_time'     => $data['end_time'] . ':00',
                    'room_name'    => $data['room_name'] ?? null,
                    'meeting_url'  => $data['meeting_url'] ?? null,
                    'status'       => 'SCHEDULED',
                    'created_at'   => $now,
                    'updated_at'   => $now,
                ];
                $currentDate->addWeek();
            }

            ScheduleSession::insert($sessions);
            DB::commit();

            return $this->buildSuccessResponse("Berhasil membuat jadwal dan {$data['meeting_target']} sesi pertemuan.");
        } catch (Throwable $e) {
            DB::rollBack();
            return $this->handleException('Gagal memproses generator jadwal.', $e);
        }
    }

    /**
     * Memproses data massal dari Wizard (Bulk Create Master & Sessions).
     *
     * @param array $data
     * @return array
     */
    public function generateWizardSchedules(array $data): array {
        try {
            DB::beginTransaction();
            
            $class = ClassRoom::with('students')->findOrFail($data['class_id']);
            $studentIds = $class->students->pluck('id')->toArray();
            $scheduleMap = []; 

            // 1. Buat Data Master Schedule untuk setiap pola mata pelajaran
            foreach ($data['patterns'] as $pattern) {
                $schedule = Schedule::create([
                    'class_id'             => $data['class_id'],
                    'subject_id'           => $pattern['subject_id'],
                    'tentor_id'            => $pattern['tentor_id'],
                    'learning_location_id' => $data['location_id'] ?? null,
                    'room_name'            => $data['room_name'] ?? null,
                    'meeting_url'          => $data['meeting_url'] ?? null,
                    'day_of_week'          => $pattern['day_of_week'],
                    'start_time'           => $pattern['start_time'],
                    'end_time'             => $pattern['end_time'],
                    'is_active'            => true,
                ]);

                if (!empty($studentIds)) {
                    $schedule->students()->sync($studentIds);
                }
                $scheduleMap[$pattern['subject_id']] = $schedule->id;
            }

            // 2. Insert Seluruh Sesi KBM
            $sessionsToInsert = [];
            $now = now();
            
            foreach ($data['sessions'] as $session) {
                $dayOfWeek = date('w', strtotime($session['session_date']));
                $sessionsToInsert[] = [
                    'id'           => Str::uuid(),
                    'schedule_id'  => $scheduleMap[$session['subject_id']], 
                    'subject_id'   => $session['subject_id'],
                    'tentor_id'    => $session['tentor_id'],
                    'location_id'  => $data['location_id'] ?? null,
                    'room_name'    => $data['room_name'] ?? null,
                    'meeting_url'  => $data['meeting_url'] ?? null,
                    'meeting_no'   => $session['meeting_no'],
                    'session_date' => $session['session_date'],
                    'day_of_week'  => $dayOfWeek,
                    'start_time'   => $session['start_time'] . ':00',
                    'end_time'     => $session['end_time'] . ':00',
                    'status'       => 'SCHEDULED',
                    'created_at'   => $now,
                    'updated_at'   => $now,
                ];
            }

            ScheduleSession::insert($sessionsToInsert);
            DB::commit();

            return $this->buildSuccessResponse('Berhasil men-generate Pola Jadwal Induk dan ' . count($sessionsToInsert) . ' sesi KBM.');
        } catch (Throwable $e) {
            DB::rollBack();
            return $this->handleException('Gagal men-generate Pola Jadwal dari Wizard.', $e);
        }
    }


    /**
     * Membuat data jadwal baru dengan validasi bentrok.
     *
     * @param array $data
     * @return array Response JSON-ready
     */
    public function createSchedule(array $data): array {
        return $this->executeScheduleTransaction(
            data: $data,
            operation: function (array $payload) {
                $schedule = Schedule::create($payload);
                $schedule->load($this->relations);
                return $schedule;
            },
            successMessage: 'Jadwal berhasil dibuat.'
        );
    }

    /**
     * Memperbarui data jadwal yang ada dengan validasi bentrok.
     *
     * @param Schedule $schedule
     * @param array $data
     * @return array Response JSON-ready
     */
    public function updateSchedule(Schedule $schedule, array $data): array {
        $data['exclude_schedule_id'] = $schedule->id;

        return $this->executeScheduleTransaction(
            data: $data,
            operation: function (array $payload) use ($schedule) {
                $schedule->fill($payload);
                $schedule->save();
                return $schedule->fresh($this->relations);
            },
            successMessage: 'Jadwal berhasil diperbarui.'
        );
    }

    /**
     * Memperbarui Master Pola Jadwal dan menerapkan efeknya ke Sesi
     */
    public function updateSchedulePattern(Schedule $schedule, array $data): array {
        try {
            DB::beginTransaction();

            // 1. Validasi Bentrok untuk Pola Master
            $validation = $this->validateSchedule(array_merge($data, ['exclude_schedule_id' => $schedule->id]));
            if (!$validation['available']) {
                // 🟢 Ambil pesan spesifik dari konflik pertama jika ada
                $conflictMessage = 'Pola jadwal baru bentrok dengan jadwal lain.';
                if (!empty($validation['conflicts'])) {
                    $firstConflict = $validation['conflicts'][0];
                    $conflictingSchedule = $firstConflict['schedule'];
                    
                    $dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                    $conflictDay = $dayNames[$conflictingSchedule['day_of_week']] ?? 'Hari Terkait';
                    $classNm = $conflictingSchedule['class_name'] ?? 'Kelas Lain';
                    $subName = $conflictingSchedule['subject_name'] ?? 'Mapel Lain';
                    $timeA = $conflictingSchedule['start_time'];
                    $timeB = $conflictingSchedule['end_time'];

                    $conflictMessage = "⚠️ BENTROK JADWAL: Tentor sudah mengajar {$subName} di {$classNm} pada hari {$conflictDay} jam {$timeA} - {$timeB}. ({$firstConflict['message']})";
                }

                throw new \Exception($conflictMessage);
            }

            // 2. Simpan hari lama untuk keperluan offset perpindahan tanggal session
            $oldDayOfWeek = $schedule->day_of_week;
            $newDayOfWeek = (int) $data['day_of_week'];

            // 3. Update Master Schedule
            $schedule->update([
                'day_of_week'          => $newDayOfWeek,
                'start_time'           => $data['start_time'],
                'end_time'             => $data['end_time'],
                'tentor_id'            => $data['tentor_id'],
                'learning_location_id' => $data['location_id'] ?? null,
                'room_name'            => $data['room_name'] ?? null,
                'meeting_url'          => $data['meeting_url'] ?? null,
            ]);

            // 4. Terapkan Perubahan ke Schedule Session (Berdasarkan apply_method)
            if ($data['apply_method'] !== 'none') {
                $query = $schedule->sessions()->where('status', 'SCHEDULED');
                
                if ($data['apply_method'] === 'uncompleted') {
                    $query->whereDate('session_date', '>=', now()->toDateString());
                } elseif ($data['apply_method'] === 'date') {
                    $query->whereDate('session_date', '>=', $data['apply_date']);
                }

                $sessionsToUpdate = $query->get();

                foreach ($sessionsToUpdate as $session) {
                    $currentDate = Carbon::parse($session->session_date);
                    
                    // Hitung tanggal baru: cari hari Minggu dari minggu tersebut, lalu tambah index hari baru
                    $sundayOfWeek = $currentDate->copy()->startOfWeek(Carbon::SUNDAY);
                    $newDate = $sundayOfWeek->copy()->addDays($newDayOfWeek);

                    // Validasi internal: Pastikan tanggal baru tidak melompat mundur ke masa lalu jika uncompleted
                    if ($data['apply_method'] === 'uncompleted' && $newDate->isBefore(now()->startOfDay())) {
                        $newDate->addWeek();
                    }

                    $session->update([
                        'session_date' => $newDate->toDateString(),
                        'day_of_week'  => $newDayOfWeek,
                        'start_time'   => $data['start_time'],
                        'end_time'     => $data['end_time'],
                        'tentor_id'    => $data['tentor_id'],
                        'location_id'  => $data['location_id'] ?? null,
                        'room_name'    => $data['room_name'] ?? null,
                        'meeting_url'  => $data['meeting_url'] ?? null,
                    ]);
                }
            }

            DB::commit();
            return $this->buildSuccessResponse('Pola Jadwal Master berhasil diperbarui.');
        } catch (\Throwable $e) {
            DB::rollBack();
            return $this->handleException('Gagal memperbarui Pola Jadwal.', $e);
        }
    }

    /**
     * Mengaktifkan/Menonaktifkan Master Jadwal
     */
    public function toggleScheduleStatus(Schedule $schedule, bool $isActive): array {
        $schedule->update(['is_active' => $isActive]);
        return $this->buildSuccessResponse($isActive ? 'Pola jadwal diaktifkan.' : 'Pola jadwal dinonaktifkan.');
    }

    /**
     * Memindahkan jadwal ke slot baru (Reschedule).
     *
     * @param Schedule $schedule
     * @param array $data
     * @return array Response JSON-ready
     */
    public function reschedule(Schedule $schedule, array $data): array {
        $data['exclude_schedule_id'] = $schedule->id;

        return $this->executeScheduleTransaction(
            data: $data,
            operation: function (array $payload) use ($schedule) {
                $schedule->fill($payload);
                $schedule->save();
                $schedule->loadMissing($this->relations);
                return $schedule;
            },
            successMessage: 'Jadwal berhasil dipindahkan.'
        );
    }

    /**
     * Menghapus data jadwal.
     *
     * @param Schedule $schedule
     * @return array Response JSON-ready
     */
    public function deleteSchedule(Schedule $schedule): array {
        // Sesi & absensi ikut terhapus (CASCADE), padahal bisa menjadi dasar tagihan/honor:
        // jadwal yang sudah berjalan hanya boleh dinonaktifkan.
        $used = $schedule->sessions()
            ->where(fn ($q) => $q->whereIn('status', ['IN_PROGRESS', 'COMPLETED'])
                ->orWhereHas('studentAttendances')
                ->orWhereHas('tentorAttendance'))
            ->exists();
        if ($used) {
            return $this->buildErrorResponse('Jadwal ini sudah memiliki sesi yang berjalan atau absensi sehingga tidak dapat dihapus. Nonaktifkan jadwal sebagai gantinya.') + ['code' => 422];
        }

        try {
            DB::transaction(fn () => $schedule->delete());

            return $this->buildSuccessResponse(
                message: 'Jadwal berhasil dihapus.'
            );
        } catch (Throwable $e) {
            return $this->handleException('Gagal menghapus jadwal.', $e);
        }
    }

    /**
     * Menguji dan memvalidasi apakah payload jadwal mengalami bentrok.
     *
     * @param array $data
     * @return array
     */
    public function validateSchedule(array $data): array {
        $schedules = $this->scheduleQuery()->get();

        $result = $this->checkConflict(
            schedules: $schedules,
            day: $data['day_of_week'],
            startTime: $data['start_time'],
            endTime: $data['end_time'],
            tentorId: $data['tentor_id'] ?? null,
            classroomId: $data['class_id'] ?? null,
            locationId: $data['location_id'] ?? null,
            roomName: $data['room_name'] ?? null,
            excludeScheduleId: $data['exclude_schedule_id'] ?? null
        );

        $result['alternatives'] = !$result['available']
            ? $this->findAlternativeSlots($data)
            : [];

        return $result;
    }

    /**
     * Mengecek ketersediaan membuat jadwal baru.
     *
     * @param array $data
     * @return bool
     */
    public function canCreate(array $data): bool {
        return $this->validateSchedule($data)['available'];
    }

    /**
     * Mengecek ketersediaan melakukan update jadwal.
     *
     * @param Schedule $schedule
     * @param array $data
     * @return bool
     */
    public function canUpdate(Schedule $schedule, array $data): bool {
        $data['exclude_schedule_id'] = $schedule->id;
        return $this->validateSchedule($data)['available'];
    }

    /**
     * Memeriksa bentrok jadwal dari koleksi data.
     *
     * @param Collection $schedules
     * @param int $day
     * @param string $startTime
     * @param string $endTime
     * @param string|null $tentorId
     * @param string|null $classroomId
     * @param string|null $locationId
     * @param string|null $roomName
     * @param string|null $excludeScheduleId
     * @return array
     */
    public function checkConflict(
        Collection $schedules,
        int $day,
        string $startTime,
        string $endTime,
        ?string $tentorId = null,
        ?string $classroomId = null,
        ?string $locationId = null,
        ?string $roomName = null,
        ?string $excludeScheduleId = null
    ): array {
        $conflicts = [];

        foreach ($schedules as $schedule) {
            if ($excludeScheduleId && $schedule->id === $excludeScheduleId) {
                continue;
            }

            if ($schedule->day_of_week != $day) {
                continue;
            }

            if (!$this->overlap($startTime, $endTime, $schedule->start_time, $schedule->end_time)) {
                continue;
            }

            $this->checkTentorConflict($conflicts, $schedule, $tentorId);
            $this->checkClassroomConflict($conflicts, $schedule, $classroomId);
            $this->checkRoomConflict($conflicts, $schedule, $locationId, $roomName);
        }

        return [
            'available' => empty($conflicts),
            'status'    => empty($conflicts) ? self::STATUS_FREE : self::STATUS_CONFLICT,
            'conflicts' => array_values($conflicts),
        ];
    }

    /**
     * Mencari rekomendasi slot alternatif ketika terjadi bentrok.
     *
     * @param array $data
     * @param int $limit
     * @return array
     */
    public function findAlternativeSlots(array $data, int $limit = 5): array {
        $alternatives = [];
        $days = config('schedule.days', []);
        $slots = config('schedule.time_slots', []);
        $schedules = $this->scheduleQuery()->get();

        foreach ($days as $dayNumber => $dayName) {
            foreach ($slots as $slot) {
                $validation = $this->checkConflict(
                    schedules: $schedules,
                    day: $dayNumber,
                    startTime: $slot['start'],
                    endTime: $slot['end'],
                    tentorId: $data['tentor_id'] ?? null,
                    classroomId: $data['class_id'] ?? null,
                    locationId: $data['location_id'] ?? null,
                    roomName: $data['room_name'] ?? null,
                    excludeScheduleId: $data['exclude_schedule_id'] ?? null
                );

                if (!$validation['available']) {
                    continue;
                }

                $alternatives[] = $this->buildAlternativeSlot(
                    day: $dayNumber,
                    dayName: $dayName,
                    start: $slot['start'],
                    end: $slot['end']
                );

                if (count($alternatives) >= $limit) {
                    break 2;
                }
            }
        }

        return $alternatives;
    }

    /*
    |--------------------------------------------------------------------------
    | PROTECTED CORE & PIPELINE METHODS
    |--------------------------------------------------------------------------
    */

    /**
     * Helper terpusat untuk mengeksekusi mutasi transaksi Schedule (Create, Update, Reschedule).
     *
     * @param array $data
     * @param callable $operation
     * @param string $successMessage
     * @return array
     */
    protected function executeScheduleTransaction(array $data, callable $operation, string $successMessage): array {
        try {
            $validation = $this->validateSchedule($data);

            if (!$validation['available']) {
                return $this->buildErrorResponse(
                    message: 'Jadwal bentrok dengan agenda lain.',
                    conflicts: $validation['conflicts'],
                    alternatives: $validation['alternatives'] ?? []
                );
            }

            $schedule = DB::transaction(function () use ($data, $operation) {
                $payload = $this->prepareUpdateData($data);
                return $operation($payload);
            });

            return $this->buildSuccessResponse(
                message: $successMessage,
                schedule: $this->formatSchedule($schedule)
            );
        } catch (Throwable $e) {
            return $this->handleException('Gagal memproses transaksi jadwal.', $e);
        }
    }

    /**
     * Eloquent Builder Query Dasar.
     *
     * @return Builder
     */
    protected function scheduleQuery(): Builder {
        return Schedule::query()
            ->with($this->relations)
            ->where('is_active', true)
            ->orderBy('day_of_week')
            ->orderBy('start_time');
    }

    /**
     * Membangun array index jadwal.
     *
     * @param Collection $schedules
     * @param string|null $tentorId
     * @param string|null $classroomId
     * @param string|null $locationId
     * @return array
     */
    protected function buildScheduleIndex(
        Collection $schedules,
        ?string $tentorId,
        ?string $classroomId,
        ?string $locationId
    ): array {
        $index = [];

        foreach ($schedules as $schedule) {
            if ($tentorId && $schedule->tentor_id !== $tentorId) {
                continue;
            }

            if ($classroomId && $schedule->class_id !== $classroomId) {
                continue;
            }

            if ($locationId && $schedule->location_id !== $locationId) {
                continue;
            }

            $key = $this->buildKey(
                day: $schedule->day_of_week,
                start: $schedule->start_time,
                end: $schedule->end_time
            );

            $index[$key][] = $schedule;
        }

        return $index;
    }

    /**
     * Menyusun data array Kalender ketersediaan.
     *
     * @param array $scheduleIndex
     * @return array
     */
    protected function generateCalendar(array $scheduleIndex): array {
        $days = config('schedule.days', []);
        $slots = config('schedule.time_slots', []);
        $calendar = [];

        foreach ($days as $dayNumber => $dayName) {
            $daySlots = [];

            foreach ($slots as $slot) {
                $key = $this->buildKey(
                    day: $dayNumber,
                    start: $slot['start'],
                    end: $slot['end']
                );

                $schedules = $scheduleIndex[$key] ?? [];
                $available = empty($schedules);

                $daySlots[] = [
                    'start_time' => $slot['start'],
                    'end_time'   => $slot['end'],
                    'available'  => $available,
                    'status'     => $available ? self::STATUS_FREE : self::STATUS_OCCUPIED,
                    'schedule'   => $available ? null : $this->formatSchedule($schedules[0]),
                    'schedules'  => collect($schedules)->map(fn (Schedule $s) => $this->formatSchedule($s))->values()->all(),
                    'conflicts'  => [],
                ];
            }

            $calendar[] = [
                'day'      => $dayNumber,
                'day_name' => $dayName,
                'slots'    => $daySlots,
            ];
        }

        return [
            'success' => true,
            'days'    => $calendar,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | HELPER & FORMATTER METHODS
    |--------------------------------------------------------------------------
    */

    protected function checkTentorConflict(array &$conflicts, Schedule $schedule, ?string $tentorId): void {
        if ($tentorId && $schedule->tentor_id === $tentorId) {
            $conflicts[] = $this->buildConflict('tentor', 'Tentor sudah memiliki jadwal pada slot ini.', $schedule);
        }
    }

    protected function checkClassroomConflict(array &$conflicts, Schedule $schedule, ?string $classroomId): void {
        if ($classroomId && $schedule->class_id === $classroomId) {
            $conflicts[] = $this->buildConflict('classroom', 'Kelas sudah memiliki jadwal pada slot ini.', $schedule);
        }
    }

    protected function checkRoomConflict(array &$conflicts, Schedule $schedule, ?string $locationId, ?string $roomName): void {
        if (!empty($locationId) && !empty($roomName)) {
            if ($schedule->location_id === $locationId && $schedule->room_name === $roomName) {
                $conflicts[] = $this->buildConflict('room', 'Ruangan sudah digunakan pada waktu tersebut.', $schedule);
            }
        }
    }

    protected function buildConflict(string $type, string $message, Schedule $schedule): array {
        return [
            'type'     => $type,
            'message'  => $message,
            'schedule' => $this->formatSchedule($schedule),
        ];
    }

    protected function buildAlternativeSlot(int $day, string $dayName, string $start, string $end): array {
        return [
            'day'        => $day,
            'day_name'   => $dayName,
            'start_time' => $start,
            'end_time'   => $end,
            'label'      => sprintf('%s (%s - %s)', $dayName, $start, $end),
        ];
    }

    protected function buildKey(int $day, string $start, string $end): string {
        return sprintf('%d|%s|%s', $day, substr($start, 0, 5), substr($end, 0, 5));
    }

    protected function formatSchedule(Schedule $schedule): array {
        return [
            'id'            => $schedule->id,
            'class_id'      => $schedule->class_id,
            'class_name'    => optional($schedule->classroom)->name ?? optional($schedule->classroom)->class_name,
            'class_type'    => optional($schedule->classroom)->class_type,
            'subject_id'    => $schedule->subject_id,
            'subject_name'  => optional($schedule->subject)->name ?? optional($schedule->subject)->subject_name,
            'tentor_id'     => $schedule->tentor_id,
            'tentor_name'   => optional(optional($schedule->tentor)->user)->full_name ?? optional(optional($schedule->tentor)->user)->name,
            'location_id'   => $schedule->location_id,
            'location_name' => optional($schedule->location)->location_name,
            'room_name'     => $schedule->room_name,
            'meeting_url'   => $schedule->meeting_url,
            'day_of_week'   => $schedule->day_of_week,
            'start_time'    => substr($schedule->start_time, 0, 5),
            'end_time'      => substr($schedule->end_time, 0, 5),
            'is_active'     => $schedule->is_active,
        ];
    }

    protected function prepareUpdateData(array $data): array {
        return [
            'class_id'    => $data['class_id'],
            'subject_id'  => $data['subject_id'],
            'tentor_id'   => $data['tentor_id'],
            'location_id' => $data['location_id'] ?? null,
            'room_name'   => $data['room_name'] ?? null,
            'meeting_url' => $data['meeting_url'] ?? null,
            'day_of_week' => $data['day_of_week'],
            'start_time'  => $data['start_time'],
            'end_time'    => $data['end_time'],
        ];
    }

    protected function overlap(string $startA, string $endA, string $startB, string $endB): bool {
        $timeStartA = strtotime(substr($startA, 0, 5));
        $timeEndA   = strtotime(substr($endA, 0, 5));
        $timeStartB = strtotime(substr($startB, 0, 5));
        $timeEndB   = strtotime(substr($endB, 0, 5));

        return ($timeStartA < $timeEndB && $timeEndA > $timeStartB);
    }

    /*
    |--------------------------------------------------------------------------
    | STANDARDIZED RESPONSE HELPERS
    |--------------------------------------------------------------------------
    */

    protected function buildSuccessResponse(string $message, ?array $schedule = null): array {
        return [
            'success'      => true,
            'message'      => $message,
            'schedule'     => $schedule,
            'conflicts'    => [],
            'alternatives' => [],
        ];
    }

    protected function buildErrorResponse(string $message, array $conflicts = [], array $alternatives = []): array {
        return [
            'success'      => false,
            'message'      => $message,
            'schedule'     => null,
            'conflicts'    => $conflicts,
            'alternatives' => $alternatives,
        ];
    }

    protected function handleException(string $defaultMessage, Throwable $e): array {
        Log::error($defaultMessage . ' Error: ' . $e->getMessage(), [
            'exception' => $e,
        ]);

        return $this->buildErrorResponse(
            message: $defaultMessage . ' (' . $e->getMessage() . ')'
        );
    }

    /**
     * Memvalidasi array pola jadwal (Wizard Step 2) terhadap database & internal patterns.
     *
     * @param array $patterns
     * @return array
     */
    public function validateWizardPatterns(array $patterns): array {
        $existingSchedules = $this->scheduleQuery()->get();
        $conflicts = [];

        foreach ($patterns as $index => $pattern) {
            $day = (int) $pattern['day_of_week'];
            $startTime = $pattern['start_time'];
            $endTime = $pattern['end_time'];
            $tentorId = $pattern['tentor_id'] ?? null;
            $subjectName = $pattern['subject_name'] ?? 'Mata Pelajaran';
            $tentorName = $pattern['tentor_name'] ?? 'Tentor';

            // 1. Validasi terhadap Database Master Schedule yang sudah ada
            foreach ($existingSchedules as $schedule) {
                if ($schedule->day_of_week == $day && 
                    $schedule->tentor_id === $tentorId && 
                    $this->overlap($startTime, $endTime, $schedule->start_time, $schedule->end_time)) {
                    
                    $conflictDayName = config("schedule.days.{$day}", 'Hari Terkait');
                    $classNm = optional($schedule->classroom)->name ?? optional($schedule->classroom)->class_name ?? 'Kelas Lain';
                    $subName = optional($schedule->subject)->name ?? optional($schedule->subject)->subject_name ?? '';
                    $timeA = substr($schedule->start_time, 0, 5);
                    $timeB = substr($schedule->end_time, 0, 5);

                    return [
                        'success' => false,
                        'message' => "⚠️ BENTROK JADWAL: Tentor {$tentorName} sudah mengajar {$subName} di {$classNm} pada hari {$conflictDayName} jam {$timeA} - {$timeB}."
                    ];
                }
            }

            // 2. Validasi Bentrok Internal (Antar mapel dalam input wizard yang sama)
            foreach ($patterns as $innerIndex => $innerPattern) {
                if ($index === $innerIndex) continue;

                if ((int)$innerPattern['day_of_week'] === $day && 
                    $innerPattern['tentor_id'] === $tentorId && 
                    $this->overlap($startTime, $endTime, $innerPattern['start_time'], $innerPattern['end_time'])) {
                    
                    return [
                        'success' => false,
                        'message' => "⚠️ BENTROK INTERNAL: Anda memplot Tentor {$tentorName} secara bersamaan untuk beberapa mapel pada hari dan jam yang bersinggungan."
                    ];
                }
            }
        }

        return [
            'success' => true,
            'message' => 'Semua pola jadwal valid dan tidak ada bentrok.'
        ];
    }

    /**
     * Membatalkan sebuah Schedule Session
     * 
     * @param ScheduleSession $session
     * @param array $data (Berisi 'reason')
     * @return array
     */
    public function cancelSession(ScheduleSession $session, array $data): array {
        // Sesi yang sudah berjalan/selesai tidak boleh dibatalkan (absensi & honor sudah tercatat)
        if (!in_array($session->status, ['SCHEDULED', 'RESCHEDULED', 'PREPARING'], true)) {
            return ['success' => false, 'code' => 422, 'message' => 'Hanya sesi yang belum dimulai yang dapat dibatalkan.'];
        }
        try {
            DB::beginTransaction();
            $session->status = 'CANCELLED';
            $session->reason = $data['reason'] ?? 'Dibatalkan tanpa alasan spesifik';
            $session->save();
            DB::commit();

            return $this->buildSuccessResponse('Sesi berhasil dibatalkan.');
        } catch (Throwable $e) {
            DB::rollBack();
            return $this->handleException('Gagal membatalkan sesi.', $e);
        }
    }

    /**
     * Memperbarui detail operasional (tanpa mengubah waktu/bentrok)
     */
    public function updateSessionDetails(ScheduleSession $session, array $data): array {
        try {
            $session->update([
                'meeting_url' => $data['meeting_url'] ?? $session->meeting_url,
                'room_name'   => $data['room_name'] ?? $session->room_name,
                'note'        => $data['note'] ?? $session->note,
            ]);

            return $this->buildSuccessResponse('Detail sesi berhasil diperbarui.');
        } catch (Throwable $e) {
            return $this->handleException('Gagal memperbarui detail sesi.', $e);
        }
    }

    /**
     * Memvalidasi potensi bentrok saat Reschedule Sesi
     */
    public function validateRescheduleSession(array $data): array {
        // Empat aturan bentrok (tentor, kelas sama, siswa di kelas lain, ruang) - lihat SessionConflictService
        $session = ScheduleSession::findOrFail($data['schedule_session_id']);
        $conflicts = app(SessionConflictService::class)->find(
            $session, $data['session_date'], $data['start_time'], $data['end_time'], $data['tentor_id'] ?? null
        );

        if ($conflicts) {
            return ['success' => false, 'message' => '⚠️ BENTROK: ' . implode(' ', $conflicts), 'conflicts' => $conflicts];
        }

        return ['success' => true, 'message' => 'Jadwal baru tersedia.'];
    }

    /**
     * Mengeksekusi perubahan jadwal (Reschedule)
     */
    public function rescheduleSession(ScheduleSession $session, array $data): array {
        try {
            DB::beginTransaction();

            // Validasi keamanan ekstra sebelum commit
            $validation = $this->validateRescheduleSession(array_merge($data, ['schedule_session_id' => $session->id]));
            if (!$validation['success']) {
                throw new \Exception($validation['message']);
            }

            // Ubah string date ke day of week index
            $sessionDate = $data['session_date'] ?? $session->session_date;
            $dayOfWeek = date('w', strtotime($data['session_date']));

            $session->update([
                'session_date' => $sessionDate,
                'day_of_week'  => $dayOfWeek,
                'start_time'   => $data['start_time'],
                'end_time'     => $data['end_time'],
                'tentor_id'    => $data['tentor_id'],
                'room_name'    => $data['room_name'] ?? $session->room_name,
                'meeting_url'  => $data['meeting_url'] ?? $session->meeting_url,
                'status'       => 'RESCHEDULED',
                'reason'       => $data['reason'] ?? 'Reschedule operasional',
                'note'         => $data['note'] ?? null,
            ]);

            DB::commit();
            return $this->buildSuccessResponse('Sesi berhasil di-reschedule.');
        } catch (Throwable $e) {
            DB::rollBack();
            return $this->handleException('Gagal me-reschedule sesi.', $e);
        }
    }
}