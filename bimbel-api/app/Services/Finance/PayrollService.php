<?php
namespace App\Services\Finance;

use App\Models\Academic\TentorAttendance;
use App\Models\Admin\Tentor;
use App\Models\Finance\Payroll;
use App\Models\Finance\PayrollDetail;
use App\Models\Finance\PayrollAdjustment;
use App\Models\Finance\PayrollException;
use App\Models\Finance\PayrollTransfer;
use App\Models\Admin\User;
use App\Notifications\PortalNotification;
use App\Support\LocalTime;
use App\Support\Pdf;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Throwable;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Honor tentor dihitung FeeRuleEngine dari absensi tentor (HADIR, sesi selesai) + absensi siswa
 * memakai aturan tarif PAYROLL (fallback: tarif per sesi tentor). Terpisah dari aturan tagihan wali.
 *
 * Payroll bulan M mencakup absensi bulan M yang belum diproses. Absensi dari bulan sebelumnya yang
 * belum dibayar tidak ikut otomatis: masuk daftar pengecualian (PayrollException), diperiksa & ditinjau,
 * lalu yang disetujui ikut payroll berikutnya yang disusun (D-05).
 * Status: DRAFT -> APPROVED -> PAID (seluruh tentor sudah ditransfer). Persetujuan & transfer mengikuti
 * mode keuangan (FinanceApproval, D-03/D-11).
 */
class PayrollService {

    public const PROOF_DISK = 'local';
    public const PROOF_FOLDER = 'payroll-proofs';

    public function __construct(protected FeeRuleEngine $engine, protected FinanceAudit $audit, protected FinanceApproval $approval) {}

    /**
     * Rekap per tentor tanpa menyimpan (pratinjau / estimasi).
     */
    public function preview(int $year, int $month, ?string $tentorId = null): array {
        $payrollId = Payroll::where('period_year', $year)->where('period_month', $month)->value('id');
        $attendances = $this->attendancesFor($year, $month, $payrollId)
            ->when($tentorId, fn($q) => $q->where('tentor_id', $tentorId))
            ->with(self::ATTENDANCE_RELATIONS)
            ->get();

        return $this->summarizeByTentor($this->engine->payrollLines($attendances));
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

            $before = $payroll ? $this->audit->snapshot($payroll) : null;
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
            // Penyusun terakhir: dipakai untuk pemisahan tugas saat persetujuan
            $payroll->update(['generated_by' => Auth::id(), 'generated_at' => now()]);

            $this->syncExceptions($year, $month);
            $attendances = $this->attendancesFor($year, $month, $payroll->id)->lockForUpdate()->get()
                ->load(self::ATTENDANCE_RELATIONS);
            $late = PayrollException::where('status', 'APPROVED')->whereIn('tentor_attendance_id', $attendances->pluck('id'))
                ->get()->keyBy('tentor_attendance_id');

            foreach ($this->engine->payrollLines($attendances) as $line) {
                $exception = $line['attendance'] ? $late->get($line['attendance']->id) : null;
                PayrollDetail::create([
                    'payroll_id'           => $payroll->id,
                    'tentor_id'            => $line['tentor']->id,
                    'tentor_attendance_id' => $line['attendance']?->id,
                    'session_id'           => $line['session']?->id,
                    'teaching_minutes'     => $line['teaching_minutes'],
                    // Kolom lama tetap diisi agar laporan lama terbaca
                    'rate_per_session'     => $line['unit_amount'],
                    'rate_per_hour'        => $line['method'] === 'PER_HOUR' ? $line['unit_amount'] : 0,
                    'subtotal'             => $line['subtotal'],
                    'fee_rule_id'          => $line['rule']?->id,
                    'calc_method'          => $line['method'],
                    'quantity'             => $line['quantity'],
                    'unit_amount'          => $line['unit_amount'],
                    'note'                 => $exception
                        ? 'Susulan ' . $this->periodLabel($exception->origin_year, $exception->origin_month) . ' (pengecualian disetujui): ' . $line['note']
                        : $line['note'],
                ]);
            }

            // Absensi yang sudah masuk payroll dikunci dari koreksi
            TentorAttendance::whereIn('id', $attendances->pluck('id'))->update(['is_payroll_processed' => true]);
            PayrollException::whereIn('id', $late->pluck('id'))->update(['target_payroll_id' => $payroll->id]);
            $this->applyAdjustments($payroll);

            $payroll = $this->refreshTotals($payroll);
            $this->audit->record($payroll, $before ? 'REGENERATED' : 'GENERATED', $before, meta: ['late_sessions' => $late->count()]);

            return $payroll;
        });
    }

    public function approve(Payroll $payroll, ?string $password = null, ?string $note = null): Payroll {
        return DB::transaction(function () use ($payroll, $password, $note) {
            $payroll = Payroll::whereKey($payroll->getKey())->lockForUpdate()->firstOrFail();
            if ($payroll->status !== 'DRAFT') {
                throw ValidationException::withMessages(['status' => ['Hanya payroll DRAFT yang dapat disetujui.']]);
            }
            if ($payroll->details()->count() === 0) {
                throw ValidationException::withMessages(['status' => ['Payroll tidak memiliki sesi untuk dibayar.']]);
            }
            if ($payroll->details()->where('calc_method', FeeRuleEngine::LEGACY)->where('unit_amount', '<=', 0)->exists()) {
                throw ValidationException::withMessages(['status' => ['Masih ada sesi tanpa aturan honor dan tarif tentor Rp 0. Buat aturan honor atau atur tarif tentor, lalu susun ulang payroll.']]);
            }

            $selfApproved = $this->approval->authorize([$payroll->generated_by ?? $payroll->created_by], $password, $note,
                'Payroll harus disetujui oleh akun yang berbeda dari penyusunnya.');

            $before = $this->audit->snapshot($payroll);
            $payroll->update([
                'status' => 'APPROVED', 'approved_at' => now(), 'approved_by' => Auth::id(),
                'approval_note' => $note, 'self_approved' => $selfApproved,
            ]);
            $this->audit->record($payroll, 'APPROVED', $before, $note, $this->approval->meta($selfApproved));

            return $payroll->refresh();
        });
    }

    /**
     * Catat transfer honor untuk satu tentor beserta bukti transfernya. Payroll PAID jika semua tentor
     * sudah ditransfer. Tentor diminta mengonfirmasi penerimaan di portalnya.
     */
    public function transfer(Payroll $payroll, string $tentorId, array $data, UploadedFile $proof): PayrollTransfer {
        $path = $proof->store(self::PROOF_FOLDER, self::PROOF_DISK);

        try {
            $transfer = DB::transaction(function () use ($payroll, $tentorId, $data, $path) {
                $payroll = Payroll::whereKey($payroll->getKey())->lockForUpdate()->firstOrFail();
                if ($payroll->status !== 'APPROVED') {
                    throw ValidationException::withMessages(['status' => ['Payroll harus disetujui sebelum honor ditransfer.']]);
                }
                $amount = (float) $payroll->details()->where('tentor_id', $tentorId)->sum('subtotal');
                if ($amount <= 0) {
                    throw ValidationException::withMessages(['tentor_id' => ['Tentor tidak memiliki honor pada payroll ini.']]);
                }
                if ($payroll->transfers()->where('tentor_id', $tentorId)->exists()) {
                    throw ValidationException::withMessages(['tentor_id' => ['Honor tentor ini sudah ditransfer.']]);
                }

                $selfApproved = $this->approval->authorize(
                    [$payroll->generated_by ?? $payroll->created_by, $payroll->approved_by],
                    $data['password'] ?? null, $data['approval_note'] ?? null,
                    'Transfer honor harus dicatat oleh akun yang berbeda dari penyusun dan penyetuju payroll.',
                );

                $transfer = PayrollTransfer::create([
                    'payroll_id'     => $payroll->id,
                    'tentor_id'      => $tentorId,
                    'amount'         => $amount,
                    'transfer_date'  => $data['transfer_date'],
                    'source_account' => $data['source_account'] ?? null,
                    'reference_no'   => $data['reference_no'],
                    'note'           => $data['note'] ?? null,
                    'paid_by'        => Auth::id(),
                    'proof_path'     => $path,
                    'approval_note'  => $data['approval_note'] ?? null,
                    'self_approved'  => $selfApproved,
                ]);
                $this->audit->record($transfer, 'TRANSFERRED', reason: $data['approval_note'] ?? null,
                    meta: ['payroll_id' => $payroll->id] + $this->approval->meta($selfApproved));

                // Tentor dengan honor bersih 0 (mis. habis oleh potongan) tidak perlu ditransfer
                $tentorCount = $payroll->details()->select('tentor_id')->groupBy('tentor_id')->havingRaw('SUM(subtotal) > 0')->get()->count();
                if ($payroll->transfers()->count() >= $tentorCount) {
                    $before = $this->audit->snapshot($payroll);
                    $payroll->update(['status' => 'PAID', 'paid_at' => now()]);
                    $this->audit->record($payroll, 'PAID', $before);
                }

                DB::afterCommit(fn() => $this->notify(
                    $transfer->tentor?->user, 'honor_transferred', 'Honor ditransfer',
                    'Honor ' . $this->periodLabel($payroll->period_year, $payroll->period_month) . ' sebesar ' . Pdf::rupiah($amount)
                        . ' sudah ditransfer. Mohon konfirmasi penerimaan di menu Honor.',
                    ['No. referensi' => $transfer->reference_no], '/tentor/honor',
                ));

                return $transfer;
            });
        } catch (Throwable $e) {
            Storage::disk(self::PROOF_DISK)->delete($path);
            throw $e;
        }

        return $transfer;
    }

    /**
     * Konfirmasi tentor atas transfer honornya (verifikasi pihak luar, D-11). RECEIVED bersifat final;
     * DISPUTED (belum diterima / nominal tidak sesuai) wajib disertai keterangan dan diberitahukan ke admin.
     */
    public function confirmReceipt(PayrollTransfer $transfer, string $status, ?string $note): PayrollTransfer {
        return DB::transaction(function () use ($transfer, $status, $note) {
            $transfer = PayrollTransfer::whereKey($transfer->getKey())->lockForUpdate()->firstOrFail();
            if ($transfer->receipt_status === 'RECEIVED') {
                throw ValidationException::withMessages(['status' => ['Penerimaan honor ini sudah dikonfirmasi.']]);
            }
            if ($status === 'DISPUTED' && mb_strlen(trim((string) $note)) < 5) {
                throw ValidationException::withMessages(['note' => ['Jelaskan kendalanya, mis. belum masuk rekening atau nominal berbeda.']]);
            }

            $before = $this->audit->snapshot($transfer);
            $transfer->update(['receipt_status' => $status, 'receipt_note' => $note, 'receipt_at' => now()]);
            $this->audit->record($transfer, $status === 'RECEIVED' ? 'RECEIPT_CONFIRMED' : 'RECEIPT_DISPUTED', $before, $note);

            if ($status === 'DISPUTED') {
                $payroll = $transfer->payroll;
                DB::afterCommit(function () use ($transfer, $payroll, $note) {
                    $admins = User::whereHas('role', fn($q) => $q->whereIn('role_name', ['admin', 'super_admin']))->get();
                    foreach ($admins as $admin) {
                        $this->notify($admin, 'honor_disputed', 'Tentor melaporkan masalah transfer honor',
                            ($transfer->tentor?->user?->name ?? 'Tentor') . ' melaporkan transfer honor ' . $payroll->payroll_no . ' (' . Pdf::rupiah($transfer->amount) . ') bermasalah.',
                            ['Keterangan' => $note], '/admin/finance');
                    }
                });
            }

            return $transfer->refresh();
        });
    }

    public function delete(Payroll $payroll): void {
        if ($payroll->status !== 'DRAFT') {
            throw ValidationException::withMessages(['status' => ['Hanya payroll DRAFT yang dapat dihapus.']]);
        }

        DB::transaction(function () use ($payroll) {
            $before = $this->audit->snapshot($payroll);
            $this->releaseDetails($payroll);
            $payroll->delete();
            $this->audit->record($payroll, 'DELETED', $before);
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
        $transfers = $payroll->transfers()->with('payer')->get()->keyBy('tentor_id');

        return $details->groupBy('tentor_id')->map(function ($rows, $id) use ($transfers) {
            $tentor = $rows->first()->tentor;
            $transfer = $transfers->get($id);

            return [
                'tentor_id'        => $id,
                'tentor_name'      => $tentor->user->name ?? '-',
                'specialization'   => $tentor->specialization,
                'rate_per_session' => (float) $rows->first()->rate_per_session,
                'calc_summary'     => $this->calcSummary($rows->map(fn($r) => [
                    'method' => $r->calc_method ?? FeeRuleEngine::LEGACY, 'quantity' => (float) $r->quantity,
                    'unit_amount' => (float) $r->unit_amount, 'session' => $r->session_id,
                ])),
                'total_sessions'   => $rows->whereNotNull('session_id')->count(),
                'teaching_minutes' => $rows->sum('teaching_minutes'),
                'total_amount'     => (float) $rows->sum('subtotal'),
                'transfer'         => $transfer ? [
                    'id'             => $transfer->id,
                    'transfer_date'  => $transfer->transfer_date->format('Y-m-d'),
                    'source_account' => $transfer->source_account,
                    'reference_no'   => $transfer->reference_no,
                    'amount'         => (float) $transfer->amount,
                    'has_proof'      => (bool) $transfer->proof_path,
                    'paid_by'        => $transfer->payer?->name,
                    'self_approved'  => $transfer->self_approved,
                    'receipt_status' => $transfer->receipt_status,
                    'receipt_note'   => $transfer->receipt_note,
                    'receipt_at'     => LocalTime::format($transfer->receipt_at, 'Y-m-d H:i'),
                ] : null,
                // Baris honor bulanan (tanpa sesi) ditaruh di akhir
                'sessions'         => $rows->sortBy(fn($r) => $r->session?->session_date ?? '9999')->values()->map(fn($r) => [
                    'session_date'     => $r->session?->session_date,
                    'start_time'       => $r->session ? substr($r->session->start_time, 0, 5) : null,
                    'end_time'         => $r->session ? substr($r->session->end_time, 0, 5) : null,
                    'subject_name'     => $r->session?->subject->name ?? ($r->adjustment_id ? 'Penyesuaian honor' : 'Honor bulanan'),
                    'class_name'       => $r->session?->schedule->classroom->name ?? '-',
                    'teaching_minutes' => $r->teaching_minutes,
                    'calc_method'      => $r->calc_method,
                    'quantity'         => (float) $r->quantity,
                    'unit_amount'      => (float) $r->unit_amount,
                    'note'             => $r->note,
                    'subtotal'         => (float) $r->subtotal,
                ]),
            ];
        })->sortBy('tentor_name')->values();
    }

    public const ATTENDANCE_RELATIONS = ['tentor.user', 'session.schedule.classroom', 'session.studentAttendances'];

    /**
     * Absensi yang dibayar pada payroll periode ini: absensi bulan periode yang belum diproses, ditambah
     * absensi periode lalu yang pengecualiannya sudah disetujui (belum masuk payroll lain).
     */
    private function attendancesFor(int $year, int $month, ?string $payrollId): Builder {
        $start = Carbon::create($year, $month, 1);
        $approvedLate = PayrollException::where('status', 'APPROVED')
            ->where(fn($q) => $q->whereNull('target_payroll_id')->when($payrollId, fn($q) => $q->orWhere('target_payroll_id', $payrollId)))
            ->select('tentor_attendance_id');

        return TentorAttendance::query()
            ->where('attendance_status', 'HADIR')
            ->where('is_payroll_processed', false)
            ->where(fn($q) => $q
                ->whereHas('session', fn($s) => $s->where('status', 'COMPLETED')
                    ->whereBetween('session_date', [$start->toDateString(), $start->copy()->endOfMonth()->toDateString()]))
                ->orWhereIn('id', $approvedLate));
    }

    /**
     * Catat absensi HADIR (sesi selesai) dari sebelum periode yang belum dibayar sebagai pengecualian OPEN,
     * dan perbarui hasil pemeriksaan pengecualian yang masih OPEN. Mengembalikan jumlah pengecualian OPEN.
     */
    public function syncExceptions(int $year, int $month): int {
        $start = Carbon::create($year, $month, 1)->toDateString();

        $candidates = TentorAttendance::query()
            ->where('attendance_status', 'HADIR')
            ->where('is_payroll_processed', false)
            ->whereHas('session', fn($q) => $q->where('status', 'COMPLETED')->whereDate('session_date', '<', $start))
            ->whereNotIn('id', PayrollException::select('tentor_attendance_id'))
            ->with(self::ATTENDANCE_RELATIONS)
            ->get();

        foreach ($candidates as $attendance) {
            $date = Carbon::parse($attendance->session->session_date);
            PayrollException::create([
                'tentor_attendance_id' => $attendance->id,
                'session_id'           => $attendance->session_id,
                'tentor_id'            => $attendance->tentor_id,
                'origin_year'          => $date->year,
                'origin_month'         => $date->month,
                'checks'               => $this->exceptionChecks($attendance),
                'status'               => 'OPEN',
            ]);
        }

        $open = PayrollException::where('status', 'OPEN')->with(self::EXCEPTION_RELATIONS)->get();
        foreach ($open as $exception) {
            $exception->update(['checks' => $this->exceptionChecks($exception->attendance)]);
        }

        return $open->count();
    }

    public function approveException(PayrollException $exception, ?string $password, ?string $note): PayrollException {
        return DB::transaction(function () use ($exception, $password, $note) {
            $exception = $this->lockOpenException($exception);
            $exception->update(['checks' => $this->exceptionChecks($exception->attendance)]);
            if (!$exception->checksPassed()) {
                throw ValidationException::withMessages(['checks' => ['Pemeriksaan belum lulus; pengecualian ini tidak dapat disetujui.']]);
            }

            $selfApproved = $this->approval->authorize([], $password, $note, '');
            $before = $this->audit->snapshot($exception);
            $exception->update([
                'status' => 'APPROVED', 'reviewed_by' => Auth::id(), 'reviewed_at' => now(),
                'note' => $note, 'self_approved' => $selfApproved,
            ]);
            $this->audit->record($exception, 'APPROVED', $before, $note, $this->approval->meta($selfApproved));

            return $exception->refresh();
        });
    }

    public function rejectException(PayrollException $exception, string $note): PayrollException {
        return DB::transaction(function () use ($exception, $note) {
            $exception = $this->lockOpenException($exception);
            $before = $this->audit->snapshot($exception);
            $exception->update(['status' => 'REJECTED', 'reviewed_by' => Auth::id(), 'reviewed_at' => now(), 'note' => $note]);
            $this->audit->record($exception, 'REJECTED', $before, $note);

            return $exception->refresh();
        });
    }

    public const EXCEPTION_RELATIONS = ['attendance.tentor.user', 'attendance.session.schedule.classroom', 'attendance.session.studentAttendances', 'attendance.session.subject'];

    private function lockOpenException(PayrollException $exception): PayrollException {
        $locked = PayrollException::whereKey($exception->getKey())->lockForUpdate()->firstOrFail();
        if ($locked->status !== 'OPEN') {
            throw ValidationException::withMessages(['status' => ['Pengecualian ini sudah ditinjau.']]);
        }
        return $locked->load(self::EXCEPTION_RELATIONS);
    }

    /** Pemeriksaan sebelum absensi periode lalu boleh dibayar: status, periode, absensi, dan duplikasi. */
    private function exceptionChecks(TentorAttendance $attendance): array {
        $session = $attendance->session;
        $date = Carbon::parse($session->session_date);
        $line = $this->engine->payrollLines(collect([$attendance]))->first(fn($l) => $l['attendance']?->id === $attendance->id);
        $paidElsewhere = PayrollDetail::where('tentor_attendance_id', $attendance->id)
            ->orWhere(fn($q) => $q->where('session_id', $session->id)->where('tentor_id', $attendance->tentor_id))
            ->with('payroll:id,payroll_no')->first();
        $origin = Payroll::where('period_year', $date->year)->where('period_month', $date->month)->first();
        $rateOk = $line && ($line['subtotal'] > 0 || $line['method'] === 'MONTHLY');

        return [
            ['key' => 'session_completed', 'label' => 'Sesi selesai', 'blocking' => true,
             'ok' => $session->status === 'COMPLETED', 'detail' => "Status sesi: {$session->status}"],
            ['key' => 'attendance_present', 'label' => 'Absensi tentor HADIR', 'blocking' => true,
             'ok' => $attendance->attendance_status === 'HADIR', 'detail' => "Status absensi: {$attendance->attendance_status}"],
            ['key' => 'not_paid', 'label' => 'Belum pernah dibayar', 'blocking' => true, 'ok' => !$paidElsewhere,
             'detail' => $paidElsewhere ? "Sudah tercatat di payroll {$paidElsewhere->payroll?->payroll_no}" : 'Tidak ada di payroll mana pun'],
            ['key' => 'rate', 'label' => 'Tarif honor tersedia', 'blocking' => true, 'ok' => $rateOk,
             'detail' => $line ? ($line['method'] === 'MONTHLY' ? 'Termasuk honor bulanan' : 'Estimasi ' . Pdf::rupiah($line['subtotal']) . " ({$line['note']})") : 'Tidak dapat dihitung'],
            ['key' => 'origin_period', 'label' => 'Periode asli ' . $this->periodLabel($date->year, $date->month), 'blocking' => false, 'ok' => true,
             'detail' => $origin ? "Payroll {$origin->payroll_no} ({$origin->status}) sudah ada; sesi ini belum termasuk" : 'Belum ada payroll untuk periode asli'],
        ];
    }

    /**
     * Penyesuaian honor dari koreksi absensi (ADDITION / DEDUCTION) masuk payroll yang disusun.
     * Potongan dibatasi agar total honor tentor tidak negatif; sisanya dibawa ke payroll berikutnya.
     */
    private function applyAdjustments(Payroll $payroll): void {
        $adjustments = PayrollAdjustment::whereIn('kind', ['ADDITION', 'DEDUCTION'])->where('status', 'OPEN')
            ->orderByRaw("CASE WHEN kind = 'ADDITION' THEN 0 ELSE 1 END")->orderBy('created_at')->orderBy('id')
            ->lockForUpdate()->get();

        foreach ($adjustments as $adjustment) {
            $balance = (float) $payroll->details()->where('tentor_id', $adjustment->tentor_id)->sum('subtotal');
            $remaining = (float) $adjustment->remaining_amount;
            $applied = $adjustment->kind === 'ADDITION' ? $remaining : round(min($remaining, max(0, $balance)), 2);
            if ($applied <= 0) continue;

            $signed = $adjustment->kind === 'ADDITION' ? $applied : -$applied;
            PayrollDetail::create([
                'payroll_id' => $payroll->id, 'tentor_id' => $adjustment->tentor_id, 'adjustment_id' => $adjustment->id,
                'teaching_minutes' => 0, 'rate_per_session' => 0, 'rate_per_hour' => 0, 'subtotal' => $signed,
                'calc_method' => 'ADJUSTMENT', 'quantity' => 1, 'unit_amount' => $signed,
                'note' => ($adjustment->kind === 'ADDITION' ? 'Penambah honor: ' : 'Potongan kelebihan honor: ') . $adjustment->note
                    . ($applied < $remaining ? ' (sebagian, sisa ' . Pdf::rupiah($remaining - $applied) . ' dibawa)' : ''),
            ]);
            $left = round($remaining - $applied, 2);
            $adjustment->update(['remaining_amount' => $left, 'status' => $left > 0 ? 'OPEN' : 'APPLIED']);
        }
    }

    /** RECOVERY: tentor sudah mengembalikan kelebihan honor. */
    public function settleRecovery(PayrollAdjustment $adjustment, string $reference, ?string $note): PayrollAdjustment {
        return DB::transaction(function () use ($adjustment, $reference, $note) {
            $adjustment = $this->lockOpenRecovery($adjustment);
            $before = $this->audit->snapshot($adjustment);
            $adjustment->update(['status' => 'SETTLED', 'remaining_amount' => 0, 'settled_by' => Auth::id(), 'settled_at' => now(),
                'settle_reference' => $reference, 'note' => trim($adjustment->note . ($note ? " • {$note}" : ''))]);
            $this->audit->record($adjustment, 'SETTLED', $before, $note);
            return $adjustment->refresh();
        });
    }

    /** RECOVERY yang tidak dikembalikan diubah menjadi potongan honor payroll berikutnya. */
    public function convertRecovery(PayrollAdjustment $adjustment, string $note): PayrollAdjustment {
        return DB::transaction(function () use ($adjustment, $note) {
            $adjustment = $this->lockOpenRecovery($adjustment);
            $before = $this->audit->snapshot($adjustment);
            $adjustment->update(['kind' => 'DEDUCTION']);
            $this->audit->record($adjustment, 'CONVERTED_TO_DEDUCTION', $before, $note);
            return $adjustment->refresh();
        });
    }

    private function lockOpenRecovery(PayrollAdjustment $adjustment): PayrollAdjustment {
        $locked = PayrollAdjustment::whereKey($adjustment->getKey())->lockForUpdate()->firstOrFail();
        if ($locked->kind !== 'RECOVERY' || $locked->status !== 'OPEN') {
            throw ValidationException::withMessages(['status' => ['Hanya permintaan pengembalian yang masih terbuka yang dapat diproses.']]);
        }
        return $locked;
    }

    private function releaseDetails(Payroll $payroll): void {
        // Penyesuaian yang sempat dipakai dikembalikan agar ikut lagi saat disusun ulang
        foreach ($payroll->details()->whereNotNull('adjustment_id')->get() as $detail) {
            $adjustment = PayrollAdjustment::lockForUpdate()->find($detail->adjustment_id);
            $adjustment?->update(['remaining_amount' => round((float) $adjustment->remaining_amount + abs((float) $detail->subtotal), 2), 'status' => 'OPEN']);
        }
        TentorAttendance::whereIn('id', $payroll->details()->select('tentor_attendance_id'))
            ->update(['is_payroll_processed' => false]);
        PayrollException::where('target_payroll_id', $payroll->id)->update(['target_payroll_id' => null]);
        $payroll->details()->delete();
    }

    private function periodLabel(int $year, int $month): string {
        return Carbon::create($year, $month, 1)->locale('id')->translatedFormat('F Y');
    }

    private function notify(?User $user, string $kind, string $title, string $message, array $details, string $link): void {
        try {
            $user?->notify(new PortalNotification($kind, $title, $message, $details, $link));
        } catch (Throwable $e) {
            Log::warning('Notifikasi payroll gagal', ['kind' => $kind, 'error' => $e->getMessage()]);
        }
    }

    private function refreshTotals(Payroll $payroll): Payroll {
        $details = $payroll->details()->get();

        $payroll->update([
            'total_tutors'           => $details->pluck('tentor_id')->unique()->count(),
            'total_sessions'         => $details->whereNotNull('session_id')->count(),
            'total_teaching_minutes' => $details->sum('teaching_minutes'),
            'total_amount'           => $details->sum(fn($d) => (float) $d->subtotal),
        ]);

        return $payroll->refresh();
    }

    private function summarizeByTentor(Collection $lines): array {
        $byTentor = $lines->groupBy(fn($line) => $line['tentor']->id)->map(fn($items) => [
            'tentor_id'        => $items->first()['tentor']->id,
            'tentor_name'      => $items->first()['tentor']->user->name ?? '-',
            'rate_per_session' => (float) $items->first()['tentor']->rate_per_session,
            'calc_summary'     => $this->calcSummary($items->map(fn($l) => [
                'method' => $l['method'], 'quantity' => $l['quantity'], 'unit_amount' => $l['unit_amount'], 'session' => $l['session']?->id,
            ])),
            'total_sessions'   => $items->whereNotNull('session')->count(),
            'teaching_minutes' => $items->sum('teaching_minutes'),
            'total_amount'     => round($items->sum('subtotal'), 2),
        ])->sortBy('tentor_name')->values();

        // Tentor yang punya sesi tanpa aturan honor dan tarif per sesinya Rp 0
        $missing = $lines->filter(fn($l) => $l['method'] === FeeRuleEngine::LEGACY && $l['unit_amount'] <= 0)
            ->map(fn($l) => $l['tentor']->user->name ?? '-')->unique()->values();

        return [
            'tentors'        => $byTentor,
            'total_sessions' => $lines->whereNotNull('session')->count(),
            'total_amount'   => round($lines->sum('subtotal'), 2),
            'missing_rate'   => $missing,
        ];
    }

    // Ringkasan rumus per tentor, mis. "4 sesi × Rp 50.000 + 9 siswa × Rp 25.000 + bulanan Rp 500.000"
    private function calcSummary(Collection $lines): string {
        $rupiah = fn($v) => 'Rp ' . number_format($v, 0, ',', '.');
        $units = ['LEGACY' => 'sesi', 'PER_MEETING' => 'pertemuan', 'PER_STUDENT' => 'siswa', 'PER_HOUR' => 'jam'];

        return $lines->groupBy(fn($l) => $l['method'] . '|' . $l['unit_amount'])
            ->map(function ($group) use ($rupiah, $units) {
                $first = $group->first();
                if ($first['method'] === 'ADJUSTMENT') {
                    return 'penyesuaian ' . $rupiah($group->sum(fn($l) => $l['quantity'] * $l['unit_amount']));
                }
                if ($first['method'] === 'MONTHLY') {
                    $fixed = $group->whereNull('session')->first();
                    return $fixed ? "bulanan {$rupiah($fixed['unit_amount'])}" : null;
                }
                $qty = round($group->sum('quantity'), 2);
                return "{$qty} {$units[$first['method']]} × {$rupiah($first['unit_amount'])}";
            })
            ->filter()
            ->join(' + ');
    }
}
