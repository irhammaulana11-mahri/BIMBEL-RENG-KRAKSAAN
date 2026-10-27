<?php
namespace App\Http\Controllers\Api\Academic;

use App\Http\Controllers\Controller;
use App\Http\Requests\Academic\ParentRequestReviewRequest;
use App\Models\Academic\RescheduleRequest;
use App\Models\Admin\StudentRegistrationRequest;
use App\Services\Academic\RescheduleRequestService;
use App\Services\Student\StudentRegistrationRequestService;

/**
 * Kotak masuk Admin: pengajuan pindah jadwal (orang tua & tentor) dan pendaftaran anak.
 */
class ParentRequestController extends Controller {

    public function __construct(
        protected RescheduleRequestService $rescheduleService,
        protected StudentRegistrationRequestService $registrationService,
    ) {}

    public function summary() {
        return response()->json(['success' => true, 'data' => $this->pendingCounts()]);
    }

    // GET reschedule-requests & student-registrations memakai method index dengan tipe dari route
    public function index(ParentRequestReviewRequest $request, string $type) {
        $status = $request->status ?: 'PENDING';

        if ($type === 'reschedule') {
            $items = RescheduleRequest::with(RescheduleRequestService::relations())
                ->when($status !== 'ALL', fn($q) => $q->where('status', $status))
                ->orderBy($status === 'PENDING' ? 'created_at' : 'updated_at', $status === 'PENDING' ? 'asc' : 'desc')
                ->limit(200)
                ->get()
                ->map(fn($r) => RescheduleRequestService::present($r) + ['can_approve' => $r->session && RescheduleRequestService::isMovable($r->session)]);
        } else {
            $items = StudentRegistrationRequest::with(StudentRegistrationRequestService::relations())
                ->when($status !== 'ALL', fn($q) => $q->where('status', $status))
                ->orderBy($status === 'PENDING' ? 'created_at' : 'updated_at', $status === 'PENDING' ? 'asc' : 'desc')
                ->limit(200)
                ->get()
                ->map(fn($r) => StudentRegistrationRequestService::present($r));
        }

        return response()->json(['success' => true, 'data' => $items, 'pending' => $this->pendingCounts()]);
    }

    public function approveReschedule(ParentRequestReviewRequest $request, RescheduleRequest $rescheduleRequest) {
        $this->rescheduleService->approve($rescheduleRequest, $request->validated());

        return response()->json(['success' => true, 'message' => 'Pengajuan disetujui. Sesi telah dipindahkan.']);
    }

    public function rejectReschedule(ParentRequestReviewRequest $request, RescheduleRequest $rescheduleRequest) {
        $this->rescheduleService->reject($rescheduleRequest, $request->review_note);

        return response()->json(['success' => true, 'message' => 'Pengajuan pindah jadwal ditolak.']);
    }

    public function approveRegistration(ParentRequestReviewRequest $request, StudentRegistrationRequest $registration) {
        $approved = $this->registrationService->approve($registration, $request->validated());
        $approved->load('student', 'classroom');

        $message = "Siswa {$approved->student->full_name} ({$approved->student->nis}) dibuat";
        $message .= $approved->classroom ? " dan ditempatkan di {$approved->classroom->name}." : '. Tempatkan siswa ke kelas melalui menu Kelas.';

        return response()->json(['success' => true, 'message' => $message]);
    }

    public function rejectRegistration(ParentRequestReviewRequest $request, StudentRegistrationRequest $registration) {
        $this->registrationService->reject($registration, $request->review_note);

        return response()->json(['success' => true, 'message' => 'Pendaftaran ditolak.']);
    }

    private function pendingCounts(): array {
        return [
            'reschedule'   => RescheduleRequest::where('status', 'PENDING')->count(),
            'registration' => StudentRegistrationRequest::where('status', 'PENDING')->count(),
        ];
    }
}
