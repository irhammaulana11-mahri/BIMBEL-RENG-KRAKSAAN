<?php
namespace App\Http\Controllers\Api\TentorPortal;

use App\Http\Controllers\Controller;
use App\Models\Admin\Tentor;
use App\Models\Finance\Payroll;
use App\Services\Finance\PayrollService;
use App\Support\LocalTime;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;

/**
 * Riwayat honor milik tentor yang login (bukan pengelolaan payroll lembaga).
 */
class TentorHonorController extends Controller {

    public function __construct(protected PayrollService $payrollService) {}

    // GET: Estimasi honor berjalan + riwayat payroll
    public function index() {
        $tentor = $this->tentor();
        $now = Carbon::now(LocalTime::TIMEZONE);

        $estimate = $this->payrollService->preview($now->year, $now->month, $tentor->id);
        $mine = collect($estimate['tentors'])->first();

        $history = Payroll::whereHas('details', fn($q) => $q->where('tentor_id', $tentor->id))
            ->orderByDesc('period_year')->orderByDesc('period_month')
            ->get()
            ->map(function ($payroll) use ($tentor) {
                $row = $this->payrollService->detailByTentor($payroll, $tentor->id)->first();
                return [
                    'payroll_id'     => $payroll->id,
                    'payroll_no'     => $payroll->payroll_no,
                    'period_label'   => Carbon::create($payroll->period_year, $payroll->period_month, 1)->locale('id')->translatedFormat('F Y'),
                    'payroll_status' => $payroll->status,
                    'total_sessions' => $row['total_sessions'] ?? 0,
                    'total_amount'   => $row['total_amount'] ?? 0,
                    'transfer'       => $row['transfer'] ?? null,
                    'sessions'       => $row['sessions'] ?? [],
                ];
            });

        return response()->json([
            'success' => true,
            'data'    => [
                'rate_per_session' => (float) $tentor->rate_per_session,
                'estimate'         => [
                    'period_label'   => $now->locale('id')->translatedFormat('F Y'),
                    'total_sessions' => $mine['total_sessions'] ?? 0,
                    'total_amount'   => $mine['total_amount'] ?? 0,
                ],
                'history'          => $history,
            ],
        ]);
    }

    private function tentor(): Tentor {
        $tentor = Tentor::where('user_id', Auth::id())->first();
        abort_unless($tentor, 403, 'Akun ini tidak terhubung dengan data tentor.');
        return $tentor;
    }
}
