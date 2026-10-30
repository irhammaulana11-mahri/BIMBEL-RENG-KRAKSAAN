<?php

namespace App\Http\Controllers\Api\TentorPortal;

use App\Http\Controllers\Controller;
use App\Models\Academic\AttendanceCorrection;
use App\Models\Academic\ScheduleSession;
use App\Models\Admin\Tentor;
use App\Services\Academic\AttendanceCorrectionService;
use App\Support\LocalTime;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Tentor mengajukan koreksi absensi siswa pada sesinya yang sudah selesai. Persetujuan hanya di Admin;
 * tentor tidak melihat dampak keuangan, hanya status pengajuan.
 */
class TentorAttendanceCorrectionController extends Controller
{
    public function __construct(protected AttendanceCorrectionService $service) {}

    public function index(Request $request)
    {
        $rows = AttendanceCorrection::with(['session.subject', 'session.schedule.classroom', 'student'])
            ->where('requested_by', Auth::id())
            ->when($request->query('session_id'), fn($q, $v) => $q->where('session_id', $v))
            ->orderByDesc('requested_at')
            ->limit(100)
            ->get();

        return response()->json(['success' => true, 'data' => $rows->map(fn($c) => $this->present($c))]);
    }

    public function store(Request $request, string $id)
    {
        $data = $request->validate([
            'student_id' => ['required', 'uuid'],
            'new_status' => ['required', Rule::in(AttendanceCorrection::ATTENDANCE_STATUSES)],
            'reason'     => ['required', 'string', 'min:10', 'max:1000'],
        ], ['reason.min' => 'Alasan koreksi minimal 10 karakter.']);

        abort_unless(Str::isUuid($id), 404, 'Sesi tidak ditemukan.');
        $session = ScheduleSession::findOrFail($id);
        $tentorId = Tentor::where('user_id', Auth::id())->value('id');
        abort_unless($tentorId && $session->tentor_id === $tentorId, 403, 'Akses ditolak. Anda bukan pengampu sesi ini.');

        if ($session->status !== 'COMPLETED') {
            throw ValidationException::withMessages(['session_id' => ['Koreksi hanya untuk sesi yang sudah selesai. Sesi yang berjalan bisa diubah langsung lewat form absensi.']]);
        }

        $correction = $this->service->request($session, $data['student_id'], $data['new_status'], $data['reason'], null, allowUnlocked: true);
        $this->service->notifyAdminsOfTentorRequest($correction);

        return response()->json(['success' => true, 'message' => 'Pengajuan koreksi terkirim. Menunggu persetujuan admin.',
            'data' => $this->present($correction->load(['session.subject', 'session.schedule.classroom', 'student']))], 201);
    }

    private function present(AttendanceCorrection $c): array
    {
        return [
            'id'           => $c->id,
            'status'       => $c->status,
            'session_id'   => $c->session_id,
            'session_date' => $c->session?->session_date,
            'class_name'   => $c->session?->schedule?->classroom?->name,
            'subject_name' => $c->session?->subject?->name,
            'student_id'   => $c->student_id,
            'student_name' => $c->student?->full_name,
            'old_status'   => $c->old_status,
            'new_status'   => $c->new_status,
            'reason'       => $c->reason,
            'requested_at' => LocalTime::format($c->requested_at, 'Y-m-d H:i'),
            'reviewed_at'  => LocalTime::format($c->reviewed_at, 'Y-m-d H:i'),
            'review_note'  => $c->review_note,
        ];
    }
}
