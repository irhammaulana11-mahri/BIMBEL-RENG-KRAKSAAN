<?php
namespace App\Http\Controllers\Api\Academic;

use App\Http\Controllers\Controller;
use App\Http\Requests\Academic\ParentRequestReviewRequest;
use App\Models\Academic\RescheduleRequest;
use App\Models\Admin\StudentRegistrationRequest;
use App\Services\Academic\RescheduleRequestService;
use App\Services\Academic\LocationChangeRequestService;
use App\Models\Academic\LocationChangeRequest;
use App\Services\Student\StudentRegistrationRequestService;

/**
 * Kotak masuk Admin: pengajuan pindah jadwal & lokasi sementara (orang tua & tentor) dan pendaftaran anak.
 */
class ParentRequestController extends Controller {

    public function __construct(
        protected RescheduleRequestService $rescheduleService,
        protected StudentRegistrationRequestService $registrationService,
        protected LocationChangeRequestService $locationChangeService,
    ) {}

    public function summary() {
        return response()->json(['success' => true, 'data' => $this->pendingCounts()]);
    }

    // GET reschedule-requests & student-registrations memakai method index dengan tipe dari route
    public function index(ParentRequestReviewRequest $request, string $type) {
        $status = $request->status ?: 'PENDING';

        if ($type === 'location') {
            $items = LocationChangeRequest::with(LocationChangeRequestService::relations())
                ->when($status !== 'ALL', fn($q) => $q->where('status', $status))
                ->orderBy($status === 'PENDING' ? 'created_at' : 'updated_at', $status === 'PENDING' ? 'asc' : 'desc')
                ->limit(200)
                ->get()
                ->map(fn($r) => LocationChangeRequestService::present($r));
        } elseif ($type === 'reschedule') {
            $items = RescheduleRequest::with(RescheduleRequestService::relations())
                ->when($status !== 'ALL', fn($q) => $q->where('status', $status))
                ->orderBy($status === 'PENDING' ? 'created_at' : 'updated_at', $status === 'PENDING' ? 'asc' : 'desc')
                ->limit(200)
                ->get()
                ->map(function ($r) {
                    $data = RescheduleRequestService::present($r);
                    // Tetap bisa dibuka meski bentrok: Admin dapat mengganti jam di form Setujui (dicek ulang saat simpan)
                    return $data + ['can_approve' => $r->session && RescheduleRequestService::isMovable($r->session)];
                });
        } else {
            $items = StudentRegistrationRequest::with(StudentRegistrationRequestService::relations())
                ->when($status !== 'ALL', fn($q) => $q->where('status', $status))
                ->orderBy($status === 'PENDING' ? 'created_at' : 'updated_at', $status === 'PENDING' ? 'asc' : 'desc')
                ->limit(200)
                ->get()
                ->map(fn($r) => StudentRegistrationRequestService::present($r));
        }

        return response()->json(['success' => true, 'data' => $items, 'pending' => $this->pendingCounts(), 'stats' => $this->stats($type)]);
    }

    public function approveReschedule(ParentRequestReviewRequest $request, RescheduleRequest $rescheduleRequest) {
        $this->rescheduleService->approve($rescheduleRequest, $request->validated());

        return response()->json(['success' => true, 'message' => 'Pengajuan disetujui. Sesi telah dipindahkan.']);
    }

    public function rejectReschedule(ParentRequestReviewRequest $request, RescheduleRequest $rescheduleRequest) {
        $this->rescheduleService->reject($rescheduleRequest, $request->review_note);

        return response()->json(['success' => true, 'message' => 'Pengajuan pindah jadwal ditolak.']);
    }

    public function approveLocation(ParentRequestReviewRequest $request, LocationChangeRequest $locationRequest) {
        $this->locationChangeService->approve($locationRequest, $request->review_note);

        return response()->json(['success' => true, 'message' => 'Pengajuan disetujui. Lokasi tersebut menjadi titik absen tentor untuk sesi ini.']);
    }

    public function rejectLocation(ParentRequestReviewRequest $request, LocationChangeRequest $locationRequest) {
        $this->locationChangeService->reject($locationRequest, $request->review_note);

        return response()->json(['success' => true, 'message' => 'Pengajuan lokasi ditolak.']);
    }

    public function approveRegistration(ParentRequestReviewRequest $request, StudentRegistrationRequest $registration) {
        $approved = $this->registrationService->approve($registration, $request->validated());

        $credentials = $approved->issued_credentials;
        $approved->load('student', 'classroom');

        $message = "Siswa {$approved->student->full_name} ({$approved->student->nis}) dibuat";
        $message .= $approved->classroom ? " dan ditempatkan di {$approved->classroom->name}." : '. Tempatkan siswa ke kelas melalui menu Kelas.';
        $message .= ' Akun login anak dibuat dan dikirim ke notifikasi orang tua.';

        return response()->json(['success' => true, 'message' => $message, 'credentials' => $credentials]);
    }

    public function rejectRegistration(ParentRequestReviewRequest $request, StudentRegistrationRequest $registration) {
        $this->registrationService->reject($registration, $request->review_note);

        return response()->json(['success' => true, 'message' => 'Pendaftaran ditolak.']);
    }

    // Rekap kartu statistik: jumlah per status + asal pengaju (orang tua / tentor)
    private function stats(string $type): array {
        $model = match ($type) {
            'location'   => LocationChangeRequest::class,
            'reschedule' => RescheduleRequest::class,
            default      => StudentRegistrationRequest::class,
        };
        $byStatus = $model::selectRaw('status, count(*) as total')->groupBy('status')->pluck('total', 'status');
        $stats = collect(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'])->mapWithKeys(fn($st) => [$st => (int) ($byStatus[$st] ?? 0)])->all();

        if ($type !== 'registration') {
            $stats['by_requester'] = $model::selectRaw('requester_type, count(*) as total')->groupBy('requester_type')->pluck('total', 'requester_type');
        }

        return $stats;
    }

    private function pendingCounts(): array {
        return [
            'reschedule'   => RescheduleRequest::where('status', 'PENDING')->count(),
            'registration' => StudentRegistrationRequest::where('status', 'PENDING')->count(),
            'location'     => LocationChangeRequest::where('status', 'PENDING')->count(),
        ];
    }
}
