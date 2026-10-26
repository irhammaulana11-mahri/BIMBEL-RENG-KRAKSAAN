<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\PayrollTransferRequest;
use App\Http\Resources\Finance\PayrollResource;
use App\Models\Admin\Tentor;
use App\Models\Finance\Payroll;
use App\Services\Finance\PayrollService;
use Illuminate\Http\Request;

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

        return response()->json([
            'data'    => $this->payrollService->preview($year, $month),
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
        ]);
    }

    public function approve(Payroll $payroll)
    {
        $payroll = $this->payrollService->approve($payroll);

        return (new PayrollResource($payroll->loadCount('transfers')))->additional(['message' => 'Payroll disetujui.']);
    }

    // POST: Catat transfer honor satu tentor
    public function transfer(PayrollTransferRequest $request, Payroll $payroll)
    {
        $data = $request->validated();
        $this->payrollService->transfer($payroll, $data['tentor_id'], $data);

        return (new PayrollResource($payroll->refresh()->loadCount('transfers')))->additional(['message' => 'Transfer honor dicatat.']);
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
