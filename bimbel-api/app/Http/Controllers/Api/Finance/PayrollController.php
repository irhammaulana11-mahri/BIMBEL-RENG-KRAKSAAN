<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\PayrollTransferRequest;
use App\Http\Resources\Finance\PayrollResource;
use App\Models\Admin\Tentor;
use App\Models\Finance\Payroll;
use App\Models\Finance\PayrollException;
use App\Models\Finance\PayrollTransfer;
use App\Services\Finance\PayrollService;
use App\Support\LocalTime;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

/**
 * Honor tentor (Admin).
 */
class PayrollController extends Controller
{
    public function __construct(protected PayrollService $payrollService) {}

    public function index(Request $request)
    {
        $payrolls = Payroll::query()
            ->withCount('transfers')
            ->when($request->filled('year'), fn($q) => $q->where('period_year', $request->integer('year')))
            ->orderByDesc('period_year')
            ->orderByDesc('period_month')
            ->get();

        return PayrollResource::collection($payrolls);
    }

    // GET: Pratinjau honor periode (sebelum disusun)
    public function preview(Request $request)
    {
        $data = $request->validate(['period' => ['required', 'date_format:Y-m']]);
        [$year, $month] = $this->parsePeriod($data['period']);

        // Absensi periode lalu yang belum dibayar dicatat sebagai pengecualian untuk ditinjau
        $openExceptions = $this->payrollService->syncExceptions($year, $month);

        return response()->json([
            'data'    => $this->payrollService->preview($year, $month),
            'open_exceptions' => $openExceptions,
            'approval_mode' => config('finance.approval_mode'),
            'payroll' => ($payroll = Payroll::where('period_year', $year)->where('period_month', $month)->first())
                ? new PayrollResource($payroll->loadCount('transfers'))
                : null,
        ]);
    }

    // POST: Susun payroll DRAFT (atau susun ulang)
    public function generate(Request $request)
    {
        $data = $request->validate(['period' => ['required', 'date_format:Y-m']]);
        [$year, $month] = $this->parsePeriod($data['period']);

        $payroll = $this->payrollService->generate($year, $month);

        return (new PayrollResource($payroll->loadCount('transfers')))->additional([
            'message' => "Payroll disusun: {$payroll->total_sessions} sesi untuk {$payroll->total_tutors} tentor.",
        ]);
    }

    public function show(Payroll $payroll)
    {
        return response()->json([
            'data'    => (new PayrollResource($payroll->loadCount('transfers')))->resolve(),
            'tentors' => $this->payrollService->detailByTentor($payroll),
            'approval_mode' => config('finance.approval_mode'),
        ]);
    }

    public function approve(Request $request, Payroll $payroll)
    {
        $data = $request->validate(['password' => ['nullable', 'string'], 'note' => ['nullable', 'string', 'max:1000']]);
        $payroll = $this->payrollService->approve($payroll, $data['password'] ?? null, $data['note'] ?? null);

        return (new PayrollResource($payroll->loadCount('transfers')))->additional(['message' => 'Payroll disetujui.']);
    }

    // POST: Catat transfer honor satu tentor
    public function transfer(PayrollTransferRequest $request, Payroll $payroll)
    {
        $data = $request->validated();
        $this->payrollService->transfer($payroll, $data['tentor_id'], $data, $request->file('proof'));

        return (new PayrollResource($payroll->refresh()->loadCount('transfers')))->additional(['message' => 'Transfer honor dicatat.']);
    }

    // GET: Bukti transfer honor (berkas privat)
    public function transferProof(Payroll $payroll, PayrollTransfer $transfer)
    {
        abort_unless($transfer->payroll_id === $payroll->id, 404);
        return self::streamTransferProof($transfer);
    }

    public static function streamTransferProof(PayrollTransfer $transfer)
    {
        $disk = Storage::disk(PayrollService::PROOF_DISK);
        abort_unless($transfer->proof_path && $disk->exists($transfer->proof_path), 404, 'Bukti transfer tidak ditemukan.');

        return $disk->response($transfer->proof_path, null, ['Cache-Control' => 'private, max-age=0']);
    }

    /*
    |--------------------------------------------------------------------------
    | PENGECUALIAN: absensi periode lalu yang belum dibayar (D-05)
    |--------------------------------------------------------------------------
    */

    public function exceptions(Request $request)
    {
        $data = $request->validate(['status' => ['nullable', Rule::in(PayrollException::STATUSES)]]);

        $rows = PayrollException::with([...PayrollService::EXCEPTION_RELATIONS, 'reviewer', 'targetPayroll'])
            ->when($data['status'] ?? null, fn($q, $v) => $q->where('status', $v))
            ->orderByRaw("CASE WHEN status = 'OPEN' THEN 0 ELSE 1 END")
            ->orderBy('origin_year')->orderBy('origin_month')
            ->get();

        return response()->json([
            'success'       => true,
            'data'          => $rows->map(fn($e) => $this->presentException($e)),
            'approval_mode' => config('finance.approval_mode'),
        ]);
    }

    public function approveException(Request $request, PayrollException $exception)
    {
        $data = $request->validate(['password' => ['nullable', 'string'], 'note' => ['nullable', 'string', 'max:1000']]);
        $exception = $this->payrollService->approveException($exception, $data['password'] ?? null, $data['note'] ?? null);

        return response()->json(['success' => true, 'message' => 'Pengecualian disetujui; sesi ikut payroll berikutnya yang disusun.',
            'data' => $this->presentException($exception->load([...PayrollService::EXCEPTION_RELATIONS, 'reviewer', 'targetPayroll']))]);
    }

    public function rejectException(Request $request, PayrollException $exception)
    {
        $data = $request->validate(['note' => ['required', 'string', 'min:5', 'max:1000']], ['note.required' => 'Alasan penolakan wajib diisi.']);
        $exception = $this->payrollService->rejectException($exception, $data['note']);

        return response()->json(['success' => true, 'message' => 'Pengecualian ditolak; sesi tidak dibayar.',
            'data' => $this->presentException($exception->load([...PayrollService::EXCEPTION_RELATIONS, 'reviewer', 'targetPayroll']))]);
    }

    private function presentException(PayrollException $e): array
    {
        $session = $e->attendance?->session;
        return [
            'id'            => $e->id,
            'status'        => $e->status,
            'tentor_name'   => $e->attendance?->tentor?->user?->name,
            'session_date'  => $session?->session_date,
            'start_time'    => $session ? substr($session->start_time, 0, 5) : null,
            'subject_name'  => $session?->subject?->name,
            'class_name'    => $session?->schedule?->classroom?->name,
            'origin_label'  => Carbon::create($e->origin_year, $e->origin_month, 1)->locale('id')->translatedFormat('F Y'),
            'checks'        => $e->checks ?? [],
            'checks_passed' => $e->checksPassed(),
            'reviewed_by'   => $e->reviewer?->name,
            'reviewed_at'   => LocalTime::format($e->reviewed_at, 'Y-m-d H:i'),
            'note'          => $e->note,
            'self_approved' => $e->self_approved,
            'target_payroll'=> $e->targetPayroll?->payroll_no,
        ];
    }

    public function destroy(Payroll $payroll)
    {
        $this->payrollService->delete($payroll);

        return response()->json(['message' => 'Payroll draft dihapus.']);
    }

    /*
    |--------------------------------------------------------------------------
    | TARIF TENTOR
    |--------------------------------------------------------------------------
    */

    public function rates()
    {
        $tentors = Tentor::with('user')->where('is_active', true)->get()
            ->map(fn($t) => [
                'id'               => $t->id,
                'name'             => $t->user->name ?? '-',
                'specialization'   => $t->specialization,
                'rate_per_session' => (float) $t->rate_per_session,
            ])
            ->sortBy('name')
            ->values();

        return response()->json(['data' => $tentors]);
    }

    public function updateRate(Request $request, Tentor $tentor)
    {
        $data = $request->validate(['rate_per_session' => ['required', 'numeric', 'min:0', 'max:100000000']]);
        $tentor->update($data);

        return response()->json(['message' => 'Tarif tentor diperbarui.', 'data' => ['rate_per_session' => (float) $tentor->rate_per_session]]);
    }

    private function parsePeriod(string $period): array
    {
        return [(int) substr($period, 0, 4), (int) substr($period, 5, 2)];
    }
}
