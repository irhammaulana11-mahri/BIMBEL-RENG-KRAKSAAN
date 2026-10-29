<?php

namespace App\Services\Finance;

use App\Models\Finance\FinanceAuditLog;
use App\Models\Finance\PayrollTransfer;
use App\Support\LocalTime;
use Carbon\Carbon;

/**
 * Laporan bulanan persetujuan atas pekerjaan sendiri (D-11 butir 6): semua aksi keuangan yang ditandai
 * self_approved beserta status konfirmasi tentor atas transfer honor bulan itu. Pada lembaga dengan satu
 * pengelola, laporan ini berfungsi sebagai arsip dan alat tinjau-diri, bukan kontrol independen.
 */
class SelfApprovalReport
{
    private const ENTITY_LABELS = [
        'payment_reversal'  => 'Reversal pembayaran',
        'payroll'           => 'Persetujuan payroll',
        'payroll_transfer'  => 'Transfer honor',
        'payroll_exception' => 'Pengecualian payroll',
        'attendance_correction' => 'Koreksi absensi',
    ];

    public function build(int $year, int $month): array {
        $range = LocalTime::monthRangeUtc($year, $month);

        $actions = FinanceAuditLog::whereBetween('created_at', $range)
            ->whereRaw("meta->>'self_approved' = 'true'")
            ->orderBy('created_at')->orderBy('id')
            ->get()
            ->map(fn($log) => [
                'time'      => LocalTime::format($log->created_at, 'd/m/Y H:i'),
                'type'      => self::ENTITY_LABELS[$log->entity_type] ?? $log->entity_type,
                'reference' => $log->after['payroll_no'] ?? $log->after['reference_no'] ?? $log->meta['payment_no'] ?? substr($log->entity_id, 0, 8),
                'amount'    => (float) ($log->after['amount'] ?? $log->after['total_amount'] ?? 0),
                'actor'     => $log->actor_name,
                'reason'    => $log->reason,
            ]);

        $transfers = PayrollTransfer::with(['tentor.user', 'payroll'])
            ->whereBetween('transfer_date', [Carbon::create($year, $month, 1)->toDateString(), Carbon::create($year, $month, 1)->endOfMonth()->toDateString()])
            ->orderBy('transfer_date')
            ->get()
            ->map(fn($t) => [
                'date'           => $t->transfer_date->format('d/m/Y'),
                'tentor'         => $t->tentor?->user?->name ?? '-',
                'payroll_no'     => $t->payroll?->payroll_no,
                'reference_no'   => $t->reference_no,
                'amount'         => (float) $t->amount,
                'self_approved'  => $t->self_approved,
                'receipt_status' => $t->receipt_status,
                'receipt_note'   => $t->receipt_note,
            ]);

        return [
            'period'    => Carbon::create($year, $month, 1)->locale('id')->translatedFormat('F Y'),
            'mode'      => config('finance.approval_mode'),
            'actions'   => $actions,
            'transfers' => $transfers,
            'summary'   => [
                'self_approved'   => $actions->count(),
                'transfers'       => $transfers->count(),
                'unconfirmed'     => $transfers->whereNull('receipt_status')->count(),
                'disputed'        => $transfers->where('receipt_status', 'DISPUTED')->count(),
            ],
        ];
    }
}
