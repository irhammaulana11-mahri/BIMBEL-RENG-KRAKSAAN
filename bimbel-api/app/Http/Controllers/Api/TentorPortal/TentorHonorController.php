<?php
namespace App\Http\Controllers\Api\TentorPortal;

use Illuminate\Support\Str;
use App\Support\Pdf;
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

        // Akumulasi pendapatan dari seluruh payroll (sudah ditransfer vs disetujui tapi belum ditransfer)
        $received = (float) $history->sum(fn($h) => $h['transfer']['amount'] ?? 0);
        $year = $now->year;

        return response()->json([
            'success' => true,
            'data'    => [
                'totals'           => [
                    'received'        => $received,
                    'awaiting'        => (float) $history->filter(fn($h) => !$h['transfer'] && $h['payroll_status'] === 'APPROVED')->sum('total_amount'),
                    'received_year'   => (float) $history->filter(fn($h) => $h['transfer'] && str_starts_with($h['transfer']['transfer_date'], (string) $year))->sum(fn($h) => $h['transfer']['amount']),
                    'year'            => $year,
                    'sessions'        => (int) $history->sum('total_sessions'),
                    'payroll_count'   => $history->count(),
                ],
                'estimate'         => [
                    'period_label'   => $now->locale('id')->translatedFormat('F Y'),
                    'total_sessions' => $mine['total_sessions'] ?? 0,
                    'total_amount'   => $mine['total_amount'] ?? 0,
                ],
                'history'          => $history,
            ],
        ]);
    }

    // GET: Slip honor PDF untuk satu payroll milik tentor ini
    public function slip(string $payrollId) {
        abort_unless(Str::isUuid($payrollId), 404, 'Payroll tidak ditemukan.');
        $tentor = $this->tentor();
        $payroll = Payroll::whereHas('details', fn($q) => $q->where('tentor_id', $tentor->id))->findOrFail($payrollId);
        $row = $this->payrollService->detailByTentor($payroll, $tentor->id)->first();
        $period = Carbon::create($payroll->period_year, $payroll->period_month, 1)->locale('id')->translatedFormat('F Y');

        return Pdf::download('pdf.honor-slip', compact('payroll', 'row', 'period'),
            'Slip-Honor-' . Str::slug($row['tentor_name']) . '-' . sprintf('%04d-%02d', $payroll->period_year, $payroll->period_month) . '.pdf');
    }

    private function tentor(): Tentor {
        $tentor = Tentor::where('user_id', Auth::id())->first();
        abort_unless($tentor, 403, 'Akun ini tidak terhubung dengan data tentor.');
        return $tentor;
    }
}
