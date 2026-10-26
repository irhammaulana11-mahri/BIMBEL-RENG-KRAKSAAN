<?php
namespace App\Services\Finance;

use App\Models\Academic\TentorAttendance;
use App\Models\Admin\Tentor;
use App\Models\Finance\Payroll;
use App\Models\Finance\PayrollDetail;
use App\Models\Finance\PayrollTransfer;
use App\Support\LocalTime;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Honor tentor = tarif per sesi tentor x sesi HADIR yang sudah selesai.
 *
 * Payroll bulan M mencakup semua absensi yang belum diproses s/d akhir bulan M,
 * sehingga absensi yang dikoreksi terlambat ikut payroll berikutnya.
 * Status: DRAFT -> APPROVED -> PAID (seluruh tentor sudah ditransfer).
 */
class PayrollService {

    /**
     * Rekap per tentor tanpa menyimpan (pratinjau / estimasi).
     */
    public function preview(int $year, int $month, ?string $tentorId = null): array {
        $attendances = $this->eligibleAttendances($year, $month)
            ->when($tentorId, fn($q) => $q->where('tentor_id', $tentorId))
            ->with(['tentor.user', 'session'])
            ->get();

        return $this->summarizeByTentor($attendances->map(fn($att) => [
            'tentor'           => $att->tentor,
            'teaching_minutes' => (int) $att->teaching_minutes,
            'subtotal'         => (float) $att->tentor->rate_per_session,
        ]));
    }

    /**
     * Buat payroll DRAFT (atau susun ulang jika masih DRAFT) untuk periode.
     */
    public function generate(int $year, int $month): Payroll {
        return DB::transaction(function () use ($year, $month) {
            $payroll = Payroll::where('period_year', $year)->where('period_month', $month)->lockForUpdate()->first();

            if ($payroll && $payroll->status !== 'DRAFT') {
                throw ValidationException::withMessages(['period' => ['Payroll periode ini sudah disetujui dan tidak dapat disusun ulang.']]);
            }

            if ($payroll) {
                $this->releaseDetails($payroll);
            } else {
                $payroll = Payroll::create([
                    'payroll_no'   => 'PRL-' . sprintf('%04d%02d', $year, $month),
                    'period_year'  => $year,
                    'period_month' => $month,
                    'payroll_date' => LocalTime::today(),
                    'status'       => 'DRAFT',
                    'created_by'   => Auth::id(),
                ]);
            }

            $attendances = $this->eligibleAttendances($year, $month)->with('tentor')->lockForUpdate()->get();

            foreach ($attendances as $attendance) {
                $rate = (float) $attendance->tentor->rate_per_session;

                PayrollDetail::create([
                    'payroll_id'           => $payroll->id,
                    'tentor_id'            => $attendance->tentor_id,
                    'tentor_attendance_id' => $attendance->id,
                    'session_id'           => $attendance->session_id,
                    'teaching_minutes'     => (int) $attendance->teaching_minutes,
                    'rate_per_session'     => $rate,
                    'rate_per_hour'        => 0,
                    'subtotal'             => $rate,
                ]);
            }

            // Absensi yang sudah masuk payroll dikunci dari koreksi
            TentorAttendance::whereIn('id', $attendances->pluck('id'))->update(['is_payroll_processed' => true]);

            return $this->refreshTotals($payroll);
        });
    }

    public function approve(Payroll $payroll): Payroll {
        if ($payroll->status !== 'DRAFT') {
            throw ValidationException::withMessages(['status' => ['Hanya payroll DRAFT yang dapat disetujui.']]);
        }
        if ($payroll->details()->count() === 0) {
            throw ValidationException::withMessages(['status' => ['Payroll tidak memiliki sesi untuk dibayar.']]);
        }
        if ($payroll->details()->where('rate_per_session', '<=', 0)->exists()) {
            throw ValidationException::withMessages(['status' => ['Masih ada tentor dengan tarif Rp 0. Atur tarif lalu susun ulang payroll.']]);
        }

        $payroll->update(['status' => 'APPROVED', 'approved_at' => now(), 'approved_by' => Auth::id()]);

        return $payroll->refresh();
    }

    /**
     * Catat transfer honor untuk satu tentor. Payroll PAID jika semua tentor sudah ditransfer.
     */
    public function transfer(Payroll $payroll, string $tentorId, array $data): PayrollTransfer {
        if ($payroll->status !== 'APPROVED') {
            throw ValidationException::withMessages(['status' => ['Payroll harus disetujui sebelum honor ditransfer.']]);
        }

        return DB::transaction(function () use ($payroll, $tentorId, $data) {
            $amount = (float) $payroll->details()->where('tentor_id', $tentorId)->sum('subtotal');
            if ($amount <= 0) {
                throw ValidationException::withMessages(['tentor_id' => ['Tentor tidak memiliki honor pada payroll ini.']]);
            }
            if ($payroll->transfers()->where('tentor_id', $tentorId)->exists()) {
                throw ValidationException::withMessages(['tentor_id' => ['Honor tentor ini sudah ditransfer.']]);
            }

            $transfer = PayrollTransfer::create([
                'payroll_id'     => $payroll->id,
                'tentor_id'      => $tentorId,
                'amount'         => $amount,
                'transfer_date'  => $data['transfer_date'],
                'source_account' => $data['source_account'] ?? null,
                'reference_no'   => $data['reference_no'] ?? null,
                'note'           => $data['note'] ?? null,
                'paid_by'        => Auth::id(),
            ]);

            $tentorCount = $payroll->details()->distinct()->count('tentor_id');
            if ($payroll->transfers()->count() >= $tentorCount) {
                $payroll->update(['status' => 'PAID', 'paid_at' => now()]);
            }

            return $transfer;
        });
    }

    public function delete(Payroll $payroll): void {
        if ($payroll->status !== 'DRAFT') {
            throw ValidationException::withMessages(['status' => ['Hanya payroll DRAFT yang dapat dihapus.']]);
        }

        DB::transaction(function () use ($payroll) {
            $this->releaseDetails($payroll);
            $payroll->delete();
        });
    }

    /**
     * Rincian payroll per tentor beserta status transfer.
     */
    public function detailByTentor(Payroll $payroll, ?string $tentorId = null): Collection {
        $details = $payroll->details()
            ->when($tentorId, fn($q) => $q->where('tentor_id', $tentorId))
            ->with(['tentor.user', 'session.subject', 'session.schedule.classroom'])
            ->get();
        $transfers = $payroll->transfers()->get()->keyBy('tentor_id');

        return $details->groupBy('tentor_id')->map(function ($rows, $id) use ($transfers) {
            $tentor = $rows->first()->tentor;
            $transfer = $transfers->get($id);

            return [
                'tentor_id'        => $id,
                'tentor_name'      => $tentor->user->name ?? '-',
                'specialization'   => $tentor->specialization,
                'rate_per_session' => (float) $rows->first()->rate_per_session,
                'total_sessions'   => $rows->count(),
                'teaching_minutes' => $rows->sum('teaching_minutes'),
                'total_amount'     => (float) $rows->sum('subtotal'),
                'transfer'         => $transfer ? [
                    'transfer_date'  => $transfer->transfer_date->format('Y-m-d'),
                    'source_account' => $transfer->source_account,
                    'reference_no'   => $transfer->reference_no,
                    'amount'         => (float) $transfer->amount,
                ] : null,
                'sessions'         => $rows->sortBy(fn($r) => $r->session->session_date)->values()->map(fn($r) => [
                    'session_date'     => $r->session->session_date,
                    'start_time'       => substr($r->session->start_time, 0, 5),
                    'end_time'         => substr($r->session->end_time, 0, 5),
                    'subject_name'     => $r->session->subject->name ?? '-',
                    'class_name'       => $r->session->schedule->classroom->name ?? '-',
                    'teaching_minutes' => $r->teaching_minutes,
                    'subtotal'         => (float) $r->subtotal,
                ]),
            ];
        })->sortBy('tentor_name')->values();
    }

    private function eligibleAttendances(int $year, int $month): Builder {
        $periodEnd = Carbon::create($year, $month, 1)->endOfMonth()->toDateString();

        return TentorAttendance::query()
            ->where('attendance_status', 'HADIR')
            ->where('is_payroll_processed', false)
            ->whereHas('session', fn($q) => $q->where('status', 'COMPLETED')->whereDate('session_date', '<=', $periodEnd));
    }

    private function releaseDetails(Payroll $payroll): void {
        TentorAttendance::whereIn('id', $payroll->details()->select('tentor_attendance_id'))
            ->update(['is_payroll_processed' => false]);
        $payroll->details()->delete();
    }

    private function refreshTotals(Payroll $payroll): Payroll {
        $details = $payroll->details()->get();

        $payroll->update([
            'total_tutors'           => $details->pluck('tentor_id')->unique()->count(),
            'total_sessions'         => $details->count(),
            'total_teaching_minutes' => $details->sum('teaching_minutes'),
            'total_amount'           => $details->sum(fn($d) => (float) $d->subtotal),
        ]);

        return $payroll->refresh();
    }

    private function summarizeByTentor(Collection $rows): array {
        $byTentor = $rows->groupBy(fn($row) => $row['tentor']->id)->map(fn($items) => [
            'tentor_id'        => $items->first()['tentor']->id,
            'tentor_name'      => $items->first()['tentor']->user->name ?? '-',
            'rate_per_session' => (float) $items->first()['tentor']->rate_per_session,
            'total_sessions'   => $items->count(),
            'teaching_minutes' => $items->sum('teaching_minutes'),
            'total_amount'     => $items->sum('subtotal'),
        ])->sortBy('tentor_name')->values();

        return [
            'tentors'        => $byTentor,
            'total_sessions' => $rows->count(),
            'total_amount'   => $rows->sum('subtotal'),
            'missing_rate'   => $byTentor->where('rate_per_session', '<=', 0)->pluck('tentor_name')->values(),
        ];
    }
}
