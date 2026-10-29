<?php
namespace App\Http\Controllers\Api\TentorPortal;

use App\Http\Controllers\Controller;
use App\Services\Tentor\TentorScheduleService;
use App\Http\Requests\Tentor\TentorScheduleRequest;
use App\Http\Requests\Academic\BulkStudentAttendanceRequest;
use App\Http\Resources\Tentor\TentorScheduleResource;
use App\Models\Academic\RescheduleRequest;
use App\Services\Academic\RescheduleRequestService;
use App\Services\Academic\AttendanceLocationService;
use App\Services\Academic\LocationChangeRequestService;
use App\Models\Academic\LocationChangeRequest;
use App\Http\Requests\Academic\LocationChangeSubmitRequest;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;

class TentorScheduleController extends Controller {
    protected $scheduleService;

    public function __construct(TentorScheduleService $scheduleService) {
        $this->scheduleService = $scheduleService;
    }

    // GET: Daftar Jadwal
    public function index(TentorScheduleRequest $request) {
        $data = $this->scheduleService->getSchedules($request->validated());
        // $data sudah berupa Resource Collection dari Service
        return response()->json(['success' => true, 'data' => $data]);
    }

    // POST: Memulai Sesi + absen masuk GPS
    // Kesalahan validasi (GPS kosong, sesi selesai) dikembalikan apa adanya (422)
    public function startSession(TentorScheduleRequest $request, $id) {
        $this->scheduleService->startSession($id, $request->validated());
        $session = $this->scheduleService->getWorkspaceData($id);

        return response()->json([
            'success' => true,
            'message' => $this->checkInMessage($session->tentorAttendance),
            'data'    => new TentorScheduleResource($session),
        ]);
    }

    private function checkInMessage($log): string {
        $remarks = AttendanceLocationService::remarks($log);
        return 'Absen masuk tercatat, sesi dimulai.' . ($remarks ? ' Keterangan: ' . implode(', ', $remarks) . '.' : '');
    }

    // POST: Mengajukan Reschedule
    // Kesalahan validasi (sesi sudah lewat, jadwal sama, pengajuan ganda) dikembalikan apa adanya (422)
    public function requestReschedule(TentorScheduleRequest $request, $id) {
        $this->scheduleService->requestReschedule($id, $request->validated());
        return response()->json(['success' => true, 'message' => 'Pengajuan reschedule terkirim. Admin akan mengonfirmasi.']);
    }

    // GET: Riwayat pengajuan reschedule milik tentor
    public function rescheduleRequests() {
        $requests = RescheduleRequest::with(RescheduleRequestService::relations())
            ->where('requested_by', Auth::id())
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json(['success' => true, 'data' => $requests->map(fn($r) => RescheduleRequestService::present($r))]);
    }

    public function cancelReschedule($id, RescheduleRequestService $service) {
        abort_unless(Str::isUuid($id), 404, 'Pengajuan tidak ditemukan.');
        $request = RescheduleRequest::where('requested_by', Auth::id())->where('id', $id)->first();
        abort_unless($request, 404, 'Pengajuan tidak ditemukan.');
        $service->cancel($request);

        return response()->json(['success' => true, 'message' => 'Pengajuan reschedule dibatalkan.']);
    }

    // GET: Membuka Halaman Workspace
    public function showWorkspace($id) {
        try {
            $session = $this->scheduleService->getWorkspaceData($id);
            return response()->json([
                'success' => true,
                // 🟢 Menggunakan Resource yang sudah digabung, plus titik sasaran absen GPS
                'data'    => (new TentorScheduleResource($session))->resolve() + $this->scheduleService->attendanceContext($session),
            ]);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => 'Sesi tidak ditemukan atau akses ditolak.'], 404);
        }
    }

    // POST: Simpan Absensi Siswa dari Workspace
    public function saveAttendance(BulkStudentAttendanceRequest $request, $id) {
        try {
            $result = $this->scheduleService->saveStudentAttendance($id, $request->validated());
            return response()->json($result, $result['success'] ? 200 : $result['code']);
        } catch (\Exception $e) {
            report($e);
            return response()->json(['success' => false, 'message' => 'Sesi tidak ditemukan atau akses ditolak.'], 404);
        }
    }

    // POST: Menyelesaikan Sesi + absen pulang GPS
    public function endSession(TentorScheduleRequest $request, $id) {
        $result = $this->scheduleService->endSession($id, $request->validated());
        return response()->json($result, $result['success'] ? 200 : $result['code']);
    }

    // POST: Ajukan lokasi les sementara untuk sesi
    public function requestLocationChange(LocationChangeSubmitRequest $request, $id) {
        $data = collect($request->validated())->except('student_id')->all();
        $created = $this->scheduleService->requestLocationChange($id, $data);

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan lokasi sementara terkirim. Admin akan mengonfirmasi.',
            'data'    => LocationChangeRequestService::present($created->load(LocationChangeRequestService::relations())),
        ], 201);
    }

    // GET: Riwayat pengajuan lokasi milik tentor
    public function locationChangeRequests() {
        $requests = LocationChangeRequest::with(LocationChangeRequestService::relations())
            ->where('requested_by', Auth::id())
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json(['success' => true, 'data' => $requests->map(fn($r) => LocationChangeRequestService::present($r))]);
    }

    public function cancelLocationChange($id, LocationChangeRequestService $service) {
        abort_unless(Str::isUuid($id), 404, 'Pengajuan tidak ditemukan.');
        $request = LocationChangeRequest::where('requested_by', Auth::id())->where('id', $id)->first();
        abort_unless($request, 404, 'Pengajuan tidak ditemukan.');
        $service->cancel($request);

        return response()->json(['success' => true, 'message' => 'Pengajuan lokasi dibatalkan.']);
    }

    // GET: Riwayat Kehadiran Tentor
    public function attendances(TentorScheduleRequest $request) {
        $data = $this->scheduleService->getMyAttendances($request->validated());
        return response()->json(['success' => true, 'data' => $data]);
    }

    public function getReferenceData($sessionId) {
        $data = $this->scheduleService->getReferenceData($sessionId);
        return response()->json(['success' => true, 'data' => $data]);
    }

    // POST: Tambah Aktivitas
    public function storeActivity(TentorScheduleRequest $request, $sessionId) {
        $activity = $this->scheduleService->storeActivity($sessionId, $request->validated());
        return response()->json([
            'success' => true, 
            'message' => 'Aktivitas berhasil ditambahkan.',
            'data' => $activity
        ]);
    }

    // PATCH: Mulai / Selesaikan / Batalkan Aktivitas
    public function startActivity($sessionId, $activityId) {
        return $this->activityStatusResponse($sessionId, $activityId, 'start', 'Aktivitas dimulai.');
    }

    public function completeActivity($sessionId, $activityId) {
        return $this->activityStatusResponse($sessionId, $activityId, 'complete', 'Aktivitas diselesaikan.');
    }

    public function cancelActivity($sessionId, $activityId) {
        return $this->activityStatusResponse($sessionId, $activityId, 'cancel', 'Aktivitas dibatalkan.');
    }

    // DELETE: Hapus Aktivitas
    public function deleteActivity($sessionId, $activityId) {
        $this->scheduleService->deleteActivity($sessionId, $activityId);
        return response()->json(['success' => true, 'message' => 'Aktivitas berhasil dihapus.']);
    }

    // PUT: Ubah Urutan Aktivitas
    public function reorderActivities(TentorScheduleRequest $request, $sessionId) {
        $this->scheduleService->reorderActivities($sessionId, $request->validated()['activity_ids']);
        return response()->json(['success' => true, 'message' => 'Urutan aktivitas diperbarui.']);
    }

    private function activityStatusResponse($sessionId, $activityId, string $action, string $message) {
        $activity = $this->scheduleService->changeActivityStatus($sessionId, $activityId, $action);
        return response()->json(['success' => true, 'message' => $message, 'data' => $activity]);
    }
}
