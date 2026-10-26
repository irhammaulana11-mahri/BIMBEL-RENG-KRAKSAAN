<?php
namespace App\Services\Finance;

use App\Models\Finance\Invoice;
use App\Models\Finance\OperationalExpense;
use App\Models\Finance\Payment;
use App\Models\Finance\PayrollTransfer;
use App\Support\LocalTime;
use Carbon\Carbon;

/**
 * Laporan arus kas bulanan (basis kas):
 * pemasukan  = pembayaran siswa CONFIRMED (tanggal bayar)
 * pengeluaran = honor tentor yang ditransfer + biaya operasional
 */
class CashflowService {

    public function summary(int $year, int $month): array {
        $income = $this->sumByMonth(Payment::where('status', 'CONFIRMED'), 'payment_date', 'total_amount', $year, $month);
        $payroll = $this->sumByMonth(PayrollTransfer::query(), 'transfer_date', 'amount', $year, $month);
        $expenses = $this->sumByMonth(OperationalExpense::query(), 'expense_date', 'amount', $year, $month);

        $byCategory = OperationalExpense::query()
            ->whereYear('expense_date', $year)->whereMonth('expense_date', $month)
            ->selectRaw('category, SUM(amount) as total')
            ->groupBy('category')
            ->pluck('total', 'category')
            ->map(fn($total, $category) => [
                'category' => $category,
                'label'    => OperationalExpense::CATEGORIES[$category] ?? $category,
                'total'    => (float) $total,
            ])->values();

        $openInvoices = Invoice::whereIn('status', ['UNPAID', 'PARTIAL']);

        return [
            'period'       => ['year' => $year, 'month' => $month],
            'income'       => $income,
            'payroll'      => $payroll,
            'expenses'     => $expenses,
            'total_out'    => $payroll + $expenses,
            'net'          => $income - $payroll - $expenses,
            'by_category'  => $byCategory,
            'receivables'  => [
                'total'          => (float) (clone $openInvoices)->sum('remaining_amount'),
                'count'          => (clone $openInvoices)->count(),
                'overdue_total'  => (float) (clone $openInvoices)->whereDate('due_date', '<', LocalTime::today())->sum('remaining_amount'),
                'overdue_count'  => (clone $openInvoices)->whereDate('due_date', '<', LocalTime::today())->count(),
            ],
            'pending_verification' => Payment::where('status', 'PENDING')->count(),
            'trend'        => $this->trend($year, $month, 6),
        ];
    }

    // Ringkasan N bulan terakhir s/d periode terpilih
    private function trend(int $year, int $month, int $months): array {
        $end = Carbon::create($year, $month, 1);

        return collect(range($months - 1, 0))->map(function ($offset) use ($end) {
            $date = $end->copy()->subMonths($offset);
            $y = $date->year;
            $m = $date->month;

            $income = $this->sumByMonth(Payment::where('status', 'CONFIRMED'), 'payment_date', 'total_amount', $y, $m);
            $out = $this->sumByMonth(PayrollTransfer::query(), 'transfer_date', 'amount', $y, $m)
                 + $this->sumByMonth(OperationalExpense::query(), 'expense_date', 'amount', $y, $m);

            return [
                'label'  => $date->locale('id')->translatedFormat('M Y'),
                'income' => $income,
                'out'    => $out,
                'net'    => $income - $out,
            ];
        })->all();
    }

    private function sumByMonth($query, string $dateColumn, string $amountColumn, int $year, int $month): float {
        return (float) $query->whereYear($dateColumn, $year)->whereMonth($dateColumn, $month)->sum($amountColumn);
    }
}
