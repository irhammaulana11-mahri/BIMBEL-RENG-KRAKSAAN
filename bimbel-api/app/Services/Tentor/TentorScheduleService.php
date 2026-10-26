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
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class TentorScheduleService {

    public function __construct(
        protected AttendanceService $attendanceService,
        protected SessionActivityService $activityService,
    ) {}
    
    // 1. Ambil Data Jadwal (Tanpa detail aktivitas & murid)
    public function getSchedules(array $filters) {
        $user = Auth::user();
        $tentor = Tentor::where('user_id', $user->id)->first();
        if (!$tentor) return collect(); 

        $query = ScheduleSession::with(['subject', 'schedule.classroom', 'location'])
            ->where('tentor_id', $tentor->id);

        $mode = $filters['filter_mode'] ?? 'hari_ini';
        if ($mode === 'hari_ini') {
            $query->whereDate('session_date', Carbon::today());
        } elseif ($mode === 'minggu_ini') {
            $query->whereBetween('session_date', [Carbon::now()->startOfWeek(), Carbon::now()->endOfWeek()]);
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

    // 3. Mulai Sesi (sekaligus check-in tentor)
    public function startSession(string $sessionId) {
        $session = $this->findOwnedSession($sessionId);

        DB::transaction(function () use ($session) {
            if (in_array($session->status, ['SCHEDULED', 'PREPARING', 'RESCHEDULED'])) {
                $session->update(['status' => 'IN_PROGRESS']);
            }

            if ($session->status === 'IN_PROGRESS') {
                $this->attendanceService->checkInTentor($session);
            }
        });

        return $session;
    }

    // 3a. Simpan Absensi Siswa dari Workspace
    public function saveStudentAttendance(string $sessionId, array $data): array {
        $session = $this->findOwnedSession($sessionId);

        if ($session->status !== 'IN_PROGRESS') {
            return ['success' => false, 'code' => 422, 'message' => 'Absensi hanya dapat diisi saat sesi sedang berlangsung.'];
        }

        return $this->attendanceService->saveBulkStudentAttendance($session, $data);
    }

    // 3b. Selesaikan Sesi (sekaligus check-out tentor)
    public function endSession(string $sessionId): array {
        $session = $this->findOwnedSession($sessionId);

        if ($session->status !== 'IN_PROGRESS') {
            return ['success' => false, 'code' => 422, 'message' => 'Hanya sesi yang sedang berlangsung yang dapat diselesaikan.'];
        }

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

        DB::transaction(function () use ($session) {
            $session->update(['status' => 'COMPLETED']);
            $this->attendanceService->checkOutTentor($session);
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
        
        $rescheduleNote = sprintf(
            "[PENGAJUAN RESCHEDULE] Tanggal: %s, Jam: %s. Alasan: %s",
            $data['proposed_date'],
            $data['proposed_time'] ?? '-',
            $data['reason']
        );

        $session->update(['reason' => $rescheduleNote]);
        return $session;
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
