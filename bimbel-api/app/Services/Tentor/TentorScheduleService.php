<?php
namespace App\Services\Tentor;

use App\Models\Academic\ScheduleSession;
use App\Models\Admin\Tentor;
use App\Models\Academic\Curriculum;
use App\Models\Exam\Exam;
use App\Models\Academic\SessionActivity;
use App\Http\Resources\Tentor\TentorScheduleResource;
use App\Http\Resources\Academic\TentorAttendanceResource;
use App\Services\Academic\AttendanceService;
use App\Services\Academic\SessionActivityService;
use App\Services\Academic\RescheduleRequestService;
use App\Services\Academic\AttendanceLocationService;
use App\Services\Academic\LocationChangeRequestService;
use App\Models\Academic\LocationChangeRequest;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TentorScheduleService {

    public function __construct(
        protected AttendanceService $attendanceService,
        protected SessionActivityService $activityService,
        protected RescheduleRequestService $rescheduleService,
        protected AttendanceLocationService $locationService,
        protected LocationChangeRequestService $locationChangeService,
    ) {}
    
    // 1. Ambil Data Jadwal (Tanpa detail aktivitas & murid)
    public function getSchedules(array $filters) {
        $user = Auth::user();
        $tentor = Tentor::where('user_id', $user->id)->first();
        if (!$tentor) return collect(); 

        $query = ScheduleSession::with(array_merge(['subject'], AttendanceLocationService::RELATIONS))
            ->where('tentor_id', $tentor->id);

        $mode = $filters['filter_mode'] ?? 'hari_ini';
        // Hari & minggu menurut WIB (timezone aplikasi UTC)
        $now = Carbon::now(AttendanceService::TIMEZONE);
        if ($mode === 'hari_ini') {
            $query->whereDate('session_date', $now->toDateString());
        } elseif ($mode === 'minggu_ini') {
            $query->whereBetween('session_date', [$now->copy()->startOfWeek()->toDateString(), $now->copy()->endOfWeek()->toDateString()]);
        } elseif ($mode === 'bulanan' && !empty($filters['month'])) {
            // 🟢 Tangani filter bulanan
            $year = substr($filters['month'], 0, 4);
            $month = substr($filters['month'], 5, 2);
            $query->whereYear('session_date', $year)->whereMonth('session_date', $month);
        }

        if (!empty($filters['keyword'])) {
            $kw = strtolower($filters['keyword']);
            $query->where(function($q) use ($kw) {
                $q->whereHas('subject', fn($sq) => $sq->whereRaw('LOWER(name) LIKE ?', ["%{$kw}%"]))
                  ->orWhereHas('schedule.classroom', fn($sq) => $sq->whereRaw('LOWER(name) LIKE ?', ["%{$kw}%"]));
            });
        }

        if (!empty($filters['status'])) {
            $query->where('status', strtoupper($filters['status']));
        }

        if (!empty($filters['class_type'])) {
            $type = strtoupper($filters['class_type']);
            $query->whereHas('schedule.classroom', fn($q) => $q->where('class_type', $type));
        }

        $sessions = $query->orderBy('session_date', 'asc')->orderBy('start_time', 'asc')->get();
        return TentorScheduleResource::collection($sessions);
    }

    // 2. Ambil Data Workspace (Eager Load Lengkap)
    public function getWorkspaceData(string $sessionId) {
        $session = $this->findOwnedSession($sessionId);
        $session->load([
            'subject', 
            'schedule.classroom.students.user', 
            'activities' => fn($q) => $q->withCount([
                'examResults as exam_submitted_count' => fn($rq) => $rq->where('status', '!=', 'IN_PROGRESS'),
                'examResults as exam_pending_count'   => fn($rq) => $rq->where('status', 'SUBMITTED'),
            ]),
            'activities.activityable', 
            'studentAttendances',
            'tentorAttendance',
        ]);

        return $session;
    }

    // 3. Mulai Sesi (sekaligus absen masuk GPS tentor)
    public function startSession(string $sessionId, array $position = []) {
        $session = $this->findOwnedSession($sessionId);

        if (in_array($session->status, ['COMPLETED', 'CANCELLED'], true)) {
            throw ValidationException::withMessages(['session' => 'Sesi sudah selesai atau dibatalkan.']);
        }
        $this->ensurePosition($session, $position);

        DB::transaction(function () use ($session, $position) {
            if (in_array($session->status, ['SCHEDULED', 'PREPARING', 'RESCHEDULED'])) {
                $session->update(['status' => 'IN_PROGRESS']);
            }

            if ($session->status === 'IN_PROGRESS') {
                $this->attendanceService->checkInTentor($session, $position, $position['source'] ?? null);
            }
        });

        return $session;
    }

    // Kelas tatap muka wajib mengirim posisi GPS; jarak di luar radius tetap diterima (diberi keterangan)
    private function ensurePosition(ScheduleSession $session, array $position): void {
        $target = $this->locationService->resolveTarget($session);
        if ($target['requires_gps'] && (!isset($position['latitude'], $position['longitude']))) {
            throw ValidationException::withMessages(['latitude' => 'Lokasi GPS belum didapat. Aktifkan GPS dan izinkan akses lokasi, lalu coba lagi.']);
        }
    }

    // Titik sasaran absen + pengajuan lokasi sementara untuk sesi (tampilan Workspace)
    public function attendanceContext(ScheduleSession $session): array {
        $request = LocationChangeRequest::where('session_id', $session->id)
            ->whereIn('status', ['PENDING', 'APPROVED', 'REJECTED'])
            ->latest()
            ->first();

        return [
            'attendance_target'        => $this->locationService->resolveTarget($session),
            'attendance_rules'         => [
                'early_checkin_minutes' => AttendanceLocationService::EARLY_CHECKIN_MINUTES,
                'late_checkout_minutes' => AttendanceLocationService::LATE_CHECKOUT_MINUTES,
            ],
            'location_change_request'  => $request ? LocationChangeRequestService::present($request->load(LocationChangeRequestService::relations())) : null,
            'can_request_location'     => LocationChangeRequestService::canRequest($session),
        ];
    }

    // 3a. Simpan Absensi Siswa dari Workspace
    public function saveStudentAttendance(string $sessionId, array $data): array {
        $session = $this->findOwnedSession($sessionId);

        if ($session->status !== 'IN_PROGRESS') {
            return ['success' => false, 'code' => 422, 'message' => 'Absensi hanya dapat diisi saat sesi sedang berlangsung.'];
        }

        return $this->attendanceService->saveBulkStudentAttendance($session, $data);
    }

    // 3b. Selesaikan Sesi (sekaligus absen pulang GPS tentor)
    public function endSession(string $sessionId, array $position = []): array {
        $session = $this->findOwnedSession($sessionId);

        if ($session->status !== 'IN_PROGRESS') {
            return ['success' => false, 'code' => 422, 'message' => 'Hanya sesi yang sedang berlangsung yang dapat diselesaikan.'];
        }
        $this->ensurePosition($session, $position);

        $session->load(['schedule.classroom.students', 'studentAttendances']);
        $unfilled = $this->attendanceService->mapStudentsWithAttendance($session)
            ->where('attendance_status', 'BELUM')
            ->count();

        if ($unfilled > 0) {
            return ['success' => false, 'code' => 422, 'message' => "Masih ada {$unfilled} siswa yang belum diabsen."];
        }

        if ($this->activityService->hasRunningActivity($session)) {
            return ['success' => false, 'code' => 422, 'message' => 'Masih ada aktivitas yang sedang berjalan. Selesaikan terlebih dahulu.'];
        }

        DB::transaction(function () use ($session, $position) {
            $session->update(['status' => 'COMPLETED']);
            $this->attendanceService->checkOutTentor($session, $position, $position['source'] ?? null);
        });

        return ['success' => true, 'message' => 'Sesi KBM berhasil diselesaikan.'];
    }

    // 3c. Riwayat Kehadiran Tentor yang login
    public function getMyAttendances(array $filters) {
        $tentorId = Tentor::where('user_id', Auth::id())->value('id');
        if (!$tentorId) return collect();

        $month = $filters['month'] ?? Carbon::now(AttendanceService::TIMEZONE)->format('Y-m');

        $sessions = $this->attendanceService
            ->withAttendanceSummary(ScheduleSession::where('tentor_id', $tentorId))
            ->whereYear('session_date', substr($month, 0, 4))
            ->whereMonth('session_date', substr($month, 5, 2))
            ->orderBy('session_date', 'desc')
            ->orderBy('start_time', 'asc')
            ->get();

        return TentorAttendanceResource::collection($sessions);
    }

    private function findOwnedSession(string $sessionId): ScheduleSession {
        $session = ScheduleSession::findOrFail($sessionId);

        $tentorId = Tentor::where('user_id', Auth::id())->value('id');
        if (!$tentorId || $session->tentor_id !== $tentorId) {
            abort(403, "Akses ditolak. Anda bukan pengampu sesi ini.");
        }

        return $session;
    }

    // 4. Request Reschedule
    public function requestReschedule(string $sessionId, array $data) {
        $session = $this->findOwnedSession($sessionId);

        // Masuk kotak pengajuan Admin (sama dengan pengajuan orang tua)
        return $this->rescheduleService->submit($session, 'TENTOR', [
            'proposed_date'       => $data['proposed_date'],
            'proposed_start_time' => $data['proposed_time'] ?? null,
            'reason'              => $data['reason'],
        ]);
    }

    // 4a. Ajukan lokasi les sementara (disetujui Admin)
    public function requestLocationChange(string $sessionId, array $data): LocationChangeRequest {
        return $this->locationChangeService->submit($this->findOwnedSession($sessionId), 'TENTOR', $data);
    }

    public function getReferenceData($sessionId) {
        $session = $this->findOwnedSession($sessionId);
        $subjectId = $session->subject_id;

        // Ambil Kurikulum beserta Materi (Bab/Topic)
        $curriculums = Curriculum::with(['materials' => function($q) {
            $q->where('is_active', true)->orderBy('sort_order', 'asc');
        }])
        ->where('subject_id', $subjectId)
        ->where('is_active', true)
        ->orderBy('order_no', 'asc')
        ->get();

        // Ambil Exam dengan menghitung jumlah soal
        $exams = Exam::withCount(['questions' => function($q) {
            $q->where('is_active', true);
        }])
        ->where('subject_id', $subjectId)
        ->where('status', 'PUBLISHED')
        ->whereHas('activeQuestions')
        ->orderBy('created_at', 'desc')
        ->get();

        return [
            'curriculums' => $curriculums,
            'exams' => $exams->map(function($exam) {
                return [
                    'id' => $exam->id,
                    'title' => $exam->title,
                    'duration' => $exam->duration,
                    'total_questions' => $exam->questions_count
                ];
            })
        ];
    }

    // 5. Aktivitas Sesi (Session Workspace)
    public function storeActivity($sessionId, array $data) {
        $session = $this->findOwnedSession($sessionId);

        return $this->activityService->create($session, [
            'activity_type'   => $data['type'],
            'title'           => $data['title'],
            'description'     => $data['description'] ?? null,
            'activityable_id' => $data['activityable_id'] ?? null,
            'start_time'      => $data['start_time'] ?? null,
            'end_time'        => $data['end_time'] ?? null,
        ]);
    }

    public function changeActivityStatus($sessionId, $activityId, string $action) {
        $activity = $this->findOwnedActivity($sessionId, $activityId);

        return match ($action) {
            'start'    => $this->activityService->start($activity),
            'complete' => $this->activityService->complete($activity),
            'cancel'   => $this->activityService->cancel($activity),
        };
    }

    public function deleteActivity($sessionId, $activityId): void {
        $this->activityService->delete($this->findOwnedActivity($sessionId, $activityId));
    }

    public function reorderActivities($sessionId, array $activityIds): void {
        $this->activityService->reorder($this->findOwnedSession($sessionId), $activityIds);
    }

    private function findOwnedActivity($sessionId, $activityId): SessionActivity {
        $session = $this->findOwnedSession($sessionId);

        return SessionActivity::where('schedule_session_id', $session->id)
            ->with('session')
            ->findOrFail($activityId);
    }
}
