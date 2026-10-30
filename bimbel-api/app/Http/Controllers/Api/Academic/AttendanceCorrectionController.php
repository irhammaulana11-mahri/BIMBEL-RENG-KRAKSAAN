<?php

namespace App\Http\Controllers\Api\Academic;

use App\Http\Controllers\Controller;
use App\Models\Academic\AttendanceCorrection;
use App\Models\Academic\ScheduleSession;
use App\Services\Academic\AttendanceCorrectionService;
use App\Support\LocalTime;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Koreksi absensi siswa yang terkunci tagihan/payroll (Admin; pengajuan juga bisa dari tentor): ajukan, tinjau dampak, setujui/tolak.
 */
class AttendanceCorrectionController extends Controller
{
    private const RELATIONS = ['session.subject', 'session.schedule.classroom', 'student', 'requester', 'reviewer'];

    public function __construct(protected AttendanceCorrectionService $service) {}

    public function index(Request $request)
    {
        $data = $request->validate(['status' => ['nullable', Rule::in(AttendanceCorrection::STATUSES)]]);

        $rows = AttendanceCorrection::with(self::RELATIONS)
            ->when($data['status'] ?? null, fn($q, $v) => $q->where('status', $v))
            ->orderByRaw("CASE WHEN status = 'PENDING' THEN 0 ELSE 1 END")
            ->orderByDesc('requested_at')
            ->limit(200)
            ->get();

        return response()->json([
            'success'       => true,
            'data'          => $rows->map(fn($c) => $this->present($c)),
            'approval_mode' => config('finance.approval_mode'),
        ]);
    }

    public function store(Request $request, ScheduleSession $session)
    {
        $data = $request->validate([
            'student_id'          => ['required', 'uuid'],
            'new_status'          => ['required', Rule::in(AttendanceCorrection::ATTENDANCE_STATUSES)],
            'reason'              => ['required', 'string', 'min:10', 'max:1000'],
            'parent_request_note' => ['nullable', 'string', 'max:500'],
        ], ['reason.min' => 'Alasan koreksi minimal 10 karakter.']);

        $correction = $this->service->request($session, $data['student_id'], $data['new_status'], $data['reason'], $data['parent_request_note'] ?? null);

        return response()->json(['success' => true, 'message' => 'Koreksi diajukan. Periksa dampak keuangannya lalu setujui.',
            'data' => $this->present($correction->load(self::RELATIONS))], 201);
    }

    public function approve(Request $request, AttendanceCorrection $correction)
    {
        $data = $request->validate([
            'password'            => ['nullable', 'string'],
            'note'                => ['nullable', 'string', 'max:1000'],
            'billing_resolution'  => ['nullable', Rule::in(['REFUND', 'CREDIT'])],
            'refund_method'       => ['nullable', Rule::in(['CASH', 'TRANSFER'])],
            'refund_reference_no' => ['nullable', 'string', 'max:100'],
            'refund_proof'        => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,pdf', 'max:5120'],
            'payroll_resolution'  => ['nullable', Rule::in(['DEDUCT', 'REFUND_REQUEST'])],
        ]);
        $correction = $this->service->approve($correction, $data, $request->file('refund_proof'));
        $this->service->notifyTentorOfDecision($correction);

        return response()->json(['success' => true, 'message' => 'Koreksi disetujui dan dampak keuangannya dicatat.',
            'data' => $this->present($correction->load(self::RELATIONS))]);
    }

    public function reject(Request $request, AttendanceCorrection $correction)
    {
        $data = $request->validate(['note' => ['required', 'string', 'min:5', 'max:1000']], ['note.required' => 'Alasan penolakan wajib diisi.']);
        $correction = $this->service->reject($correction, $data['note']);
        $this->service->notifyTentorOfDecision($correction);

        return response()->json(['success' => true, 'message' => 'Koreksi ditolak; absensi tidak berubah.', 'data' => $this->present($correction->load(self::RELATIONS))]);
    }

    private function present(AttendanceCorrection $c): array
    {
        return [
            'id'                  => $c->id,
            'status'              => $c->status,
            'session_id'          => $c->session_id,
            'session_date'        => $c->session?->session_date,
            'start_time'          => $c->session ? substr($c->session->start_time, 0, 5) : null,
            'class_name'          => $c->session?->schedule?->classroom?->name,
            'subject_name'        => $c->session?->subject?->name,
            'student_id'          => $c->student_id,
            'student_name'        => $c->student?->full_name,
            'old_status'          => $c->old_status,
            'new_status'          => $c->new_status,
            'reason'              => $c->reason,
            'parent_request_note' => $c->parent_request_note,
            'requested_by'        => $c->requester?->name,
            'requested_by_id'     => $c->requested_by,
            'requested_at'        => LocalTime::format($c->requested_at, 'Y-m-d H:i'),
            'reviewed_by'         => $c->reviewer?->name,
            'reviewed_at'         => LocalTime::format($c->reviewed_at, 'Y-m-d H:i'),
            'review_note'         => $c->review_note,
            'self_approved'       => $c->self_approved,
            'financial_effect'    => $c->financial_effect,
            'billing_resolution'  => $c->billing_resolution,
            'payroll_resolution'  => $c->payroll_resolution,
        ];
    }
}
