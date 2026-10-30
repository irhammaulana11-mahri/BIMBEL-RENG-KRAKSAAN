<?php

namespace App\Services\Academic;

use App\Models\Academic\AttendanceCorrection;
use App\Models\Academic\ClassRoom;
use App\Models\Academic\ScheduleSession;
use App\Models\Academic\StudentAttendance;
use App\Models\Academic\TentorAttendance;
use App\Models\Finance\CreditApplication;
use App\Models\Finance\CreditNote;
use App\Models\Finance\Invoice;
use App\Models\Finance\PayrollAdjustment;
use App\Models\Finance\Refund;
use App\Notifications\PortalNotification;
use App\Services\Finance\FeeRuleEngine;
use App\Services\Finance\FinanceApproval;
use App\Services\Finance\FinanceAudit;
use App\Services\Finance\InvoiceService;
use App\Services\Finance\PayrollService;
use App\Support\Pdf;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Koreksi absensi siswa yang terkunci (D-01). Tagihan, item tagihan, dan payroll yang sudah terbit tidak
 * diubah; dampak keuangan dicatat sebagai data baru:
 * - kurang tagih  : tagihan penyesuaian (ADJUSTMENT) yang merujuk tagihan asli
 * - lebih tagih   : bagian yang belum dibayar menjadi kredit untuk tagihan asli; bagian yang sudah dibayar
 *                   dikembalikan (REFUND, dengan bukti) atau menjadi saldo kredit tagihan berikutnya (CREDIT)
 * - honor berubah : payroll DRAFT cukup disusun ulang; payroll disetujui/dibayar mendapat penyesuaian
 *                   (ADDITION / DEDUCTION di payroll berikutnya, atau RECOVERY = minta pengembalian)
 * Selisih dihitung dengan mesin tarif (sebelum vs sesudah) dan dikalikan tarif snapshot yang tercatat.
 */
class AttendanceCorrectionService
{
    public const PROOF_DISK = 'local';
    public const PROOF_FOLDER = 'refund-proofs';
    private const LABELS = ['HADIR' => 'Hadir', 'IZIN' => 'Izin', 'SAKIT' => 'Sakit', 'ALPA' => 'Alpa', 'BELUM' => 'Belum diisi'];

    public function __construct(
        protected AttendanceLock $lock,
        protected FeeRuleEngine $engine,
        protected InvoiceService $invoices,
        protected FinanceAudit $audit,
        protected FinanceApproval $approval,
    ) {}

    public function request(ScheduleSession $session, string $studentId, string $newStatus, string $reason, ?string $parentNote = null, bool $allowUnlocked = false): AttendanceCorrection {
        return DB::transaction(function () use ($session, $studentId, $newStatus, $reason, $parentNote, $allowUnlocked) {
            $session->loadMissing('schedule.classroom');
            if (!$session->schedule?->classroom?->students()->where('master.students.id', $studentId)->exists()) {
                throw ValidationException::withMessages(['student_id' => ['Siswa bukan peserta kelas sesi ini.']]);
            }
            if (!$allowUnlocked && !$this->lock->reason($session, $studentId)) {
                throw ValidationException::withMessages(['session_id' => ['Absensi ini belum terkunci; ubah langsung lewat form absensi.']]);
            }

            $attendance = StudentAttendance::where('session_id', $session->id)->where('student_id', $studentId)->first();
            $oldStatus = $attendance?->attendance_status ?? 'BELUM';
            if ($oldStatus === $newStatus) {
                throw ValidationException::withMessages(['new_status' => ['Status baru sama dengan status saat ini.']]);
            }
            if (AttendanceCorrection::where('session_id', $session->id)->where('student_id', $studentId)->where('status', 'PENDING')->exists()) {
                throw ValidationException::withMessages(['student_id' => ['Masih ada koreksi yang menunggu persetujuan untuk absensi ini.']]);
            }

            $correction = AttendanceCorrection::create([
                'session_id'            => $session->id,
                'student_id'            => $studentId,
                'student_attendance_id' => $attendance?->id,
                'old_status'            => $oldStatus,
                'new_status'            => $newStatus,
                'reason'                => $reason,
                'parent_request_note'   => $parentNote,
                'status'                => 'PENDING',
                'requested_by'          => Auth::id(),
                'requested_at'          => now(),
                'financial_effect'      => $this->computeEffect($session, $studentId, $newStatus),
            ]);
            $this->audit->record($correction, 'REQUESTED', reason: $reason);

            return $correction;
        });
    }

    public function notifyAdminsOfTentorRequest(AttendanceCorrection $correction): void {
        try {
            $admins = \App\Models\Admin\User::whereHas('role', fn($q) => $q->whereIn('role_name', ['admin', 'super_admin']))->get();
            $tentor = Auth::user()?->name ?? 'Tentor';
            $label = $this->sessionLabel($correction);
            foreach ($admins as $admin) {
                $admin->notify(new PortalNotification('attendance_correction_requested', 'Tentor mengajukan koreksi absensi',
                    "{$tentor} mengajukan koreksi absensi {$label}.", ['Alasan' => $correction->reason], '/admin/attandances'));
            }
        } catch (Throwable $e) {
            Log::warning('Notifikasi pengajuan koreksi tentor gagal', ['correction' => $correction->id, 'error' => $e->getMessage()]);
        }
    }

    public function notifyTentorOfDecision(AttendanceCorrection $correction): void {
        try {
            $requester = $correction->requester()->with('role')->first();
            if ($requester?->role?->role_name !== 'tentor' || $requester->id === $correction->reviewed_by) return;

            $approved = $correction->status === 'APPROVED';
            $requester->notify(new PortalNotification(
                $approved ? 'attendance_correction_approved' : 'attendance_correction_rejected',
                $approved ? 'Koreksi absensi disetujui' : 'Koreksi absensi ditolak',
                'Pengajuan koreksi absensi ' . $this->sessionLabel($correction) . ($approved ? ' disetujui.' : ' ditolak.'),
                array_filter(['Catatan admin' => $correction->review_note]),
                '/tentor/attendances',
            ));
        } catch (Throwable $e) {
            Log::warning('Notifikasi keputusan koreksi ke tentor gagal', ['correction' => $correction->id, 'error' => $e->getMessage()]);
        }
    }

    /**
     * Dampak keuangan bila absensi siswa di sesi ini menjadi $newStatus.
     */
    public function computeEffect(ScheduleSession $session, string $studentId, string $newStatus): array {
        $date = Carbon::parse($session->session_date);
        $billing = null;

        if ($invoice = $this->lock->invoiceFor($session, $studentId)) {
            $class = ClassRoom::with('package')->findOrFail($invoice->class_id);
            $sessions = ScheduleSession::with('studentAttendances')
                ->whereHas('schedule', fn($q) => $q->where('class_id', $class->id))
                ->where('status', 'COMPLETED')
                ->whereBetween('session_date', [$date->copy()->startOfMonth()->toDateString(), $date->copy()->endOfMonth()->toDateString()])
                ->get();
            $before = $this->engine->billingItems($class, $studentId, $sessions, $date->year, $date->month)['items'];
            $after = $this->engine->billingItems($class, $studentId, $this->withStatus($sessions, $session->id, $studentId, $newStatus), $date->year, $date->month)['items'];
            $lines = $this->billingDelta($before, $after, $invoice->items()->get());
            $delta = round(collect($lines)->sum('amount'), 2);
            $unpaid = $delta < 0 ? min(abs($delta), (float) $invoice->remaining_amount) : 0;

            $billing = [
                'invoice_id'      => $invoice->id,
                'invoice_no'      => $invoice->invoice_no,
                'invoice_status'  => $invoice->status,
                'delta'           => $delta,
                'lines'           => $lines,
                // Lebih tagih: bagian yang belum dibayar langsung jadi kredit; sisanya perlu refund/kredit
                'unpaid_portion'  => round($unpaid, 2),
                'paid_portion'    => $delta < 0 ? round(abs($delta) - $unpaid, 2) : 0,
            ];
        }

        $payroll = null;
        if ($detail = $this->lock->payrollDetailFor($session)) {
            $tentorAttendance = TentorAttendance::with(PayrollService::ATTENDANCE_RELATIONS)->findOrFail($detail->tentor_attendance_id);
            $modified = clone $tentorAttendance;
            $modified->setRelation('session', $this->withStatus(collect([$tentorAttendance->session]), $session->id, $studentId, $newStatus)->first());

            $qty = fn($att) => (float) ($this->engine->payrollLines(collect([$att]))->first(fn($l) => $l['attendance']?->id === $att->id)['quantity'] ?? 0);
            $deltaQty = round($qty($modified) - $qty($tentorAttendance), 2);

            $payroll = [
                'payroll_id'     => $detail->payroll_id,
                'payroll_no'     => $detail->payroll?->payroll_no,
                'payroll_status' => $detail->payroll?->status,
                'tentor_id'      => $detail->tentor_id,
                'tentor_name'    => $tentorAttendance->tentor?->user?->name,
                'quantity'       => $deltaQty,
                'unit_amount'    => (float) $detail->unit_amount,
                'delta'          => round($deltaQty * (float) $detail->unit_amount, 2),
            ];
        }

        return [
            'session_date' => $date->toDateString(),
            'billing'      => $billing,
            'payroll'      => $payroll,
            'computed_at'  => now()->toIso8601String(),
        ];
    }

    /**
     * @param array $data password, note, billing_resolution (REFUND|CREDIT), refund_method, refund_reference_no,
     *                    payroll_resolution (DEDUCT|REFUND_REQUEST)
     */
    public function approve(AttendanceCorrection $correction, array $data, ?UploadedFile $refundProof = null): AttendanceCorrection {
        $proofPath = $refundProof?->store(self::PROOF_FOLDER, self::PROOF_DISK);

        try {
            return DB::transaction(function () use ($correction, $data, $proofPath) {
                $correction = $this->lockPending($correction);
                $selfApproved = $this->approval->authorize([$correction->requested_by], $data['password'] ?? null, $data['note'] ?? null,
                    'Koreksi absensi harus disetujui akun yang berbeda dari pengaju.');

                $session = $correction->session()->with('schedule')->firstOrFail();
                $effect = $this->computeEffect($session, $correction->student_id, $correction->new_status);
                $billing = $effect['billing'];
                $payroll = $effect['payroll'];

                $billingResolution = null;
                if ($billing && $billing['paid_portion'] > 0) {
                    $billingResolution = $data['billing_resolution'] ?? null;
                    if (!in_array($billingResolution, ['REFUND', 'CREDIT'], true)) {
                        throw ValidationException::withMessages(['billing_resolution' => ['Pilih: dana dikembalikan (refund) atau menjadi kredit tagihan berikutnya.']]);
                    }
                    if ($billingResolution === 'REFUND' && (!$proofPath || !in_array($data['refund_method'] ?? null, ['CASH', 'TRANSFER'], true))) {
                        throw ValidationException::withMessages(['refund_proof' => ['Pengembalian dana wajib disertai metode dan bukti.']]);
                    }
                }
                $payrollResolution = null;
                $payrollFinal = $payroll && $payroll['delta'] != 0 && $payroll['payroll_status'] !== 'DRAFT';
                if ($payrollFinal && $payroll['delta'] < 0) {
                    $payrollResolution = $data['payroll_resolution'] ?? null;
                    if (!in_array($payrollResolution, ['DEDUCT', 'REFUND_REQUEST'], true)) {
                        throw ValidationException::withMessages(['payroll_resolution' => ['Pilih: potong honor bulan berikutnya atau minta pengembalian dana ke tentor.']]);
                    }
                }

                $this->applyAttendance($correction);
                $results = [];

                if ($billing && $billing['delta'] != 0) {
                    $invoice = Invoice::whereKey($billing['invoice_id'])->lockForUpdate()->firstOrFail();
                    $results += $billing['delta'] > 0
                        ? ['adjustment_invoice_no' => $this->invoices->createAdjustment($invoice, $this->adjustmentItems($correction, $billing['lines']), $correction)->invoice_no]
                        : $this->resolveOverbilling($invoice, $correction, $billing, $billingResolution, $data, $proofPath);
                }

                if ($payrollFinal) {
                    $kind = $payroll['delta'] > 0 ? 'ADDITION' : ($payrollResolution === 'DEDUCT' ? 'DEDUCTION' : 'RECOVERY');
                    $adjustment = PayrollAdjustment::create([
                        'tentor_id'         => $payroll['tentor_id'],
                        'correction_id'     => $correction->id,
                        'source_payroll_id' => $payroll['payroll_id'],
                        'kind'              => $kind,
                        'amount'            => abs($payroll['delta']),
                        'remaining_amount'  => abs($payroll['delta']),
                        'status'            => 'OPEN',
                        'note'              => 'Koreksi absensi ' . $this->sessionLabel($correction) . " (payroll {$payroll['payroll_no']})",
                    ]);
                    $results['payroll_adjustment'] = ['id' => $adjustment->id, 'kind' => $kind, 'amount' => abs($payroll['delta'])];
                } elseif ($payroll && $payroll['delta'] != 0) {
                    $results['payroll_note'] = "Payroll {$payroll['payroll_no']} masih draf: susun ulang agar honor mengikuti koreksi.";
                }

                $before = $this->audit->snapshot($correction);
                $correction->update([
                    'status'             => 'APPROVED',
                    'reviewed_by'        => Auth::id(),
                    'reviewed_at'        => now(),
                    'review_note'        => $data['note'] ?? null,
                    'self_approved'      => $selfApproved,
                    'financial_effect'   => $effect + ['results' => $results],
                    'billing_resolution' => $billingResolution,
                    'payroll_resolution' => $payrollResolution,
                ]);
                $this->audit->record($correction, 'APPROVED', $before, $data['note'] ?? null, $this->approval->meta($selfApproved) + ['results' => $results]);

                DB::afterCommit(fn() => $this->notify($correction->refresh(), $billing, $payrollFinal ? $payroll : null, $results));

                return $correction->refresh();
            });
        } catch (Throwable $e) {
            if ($proofPath) Storage::disk(self::PROOF_DISK)->delete($proofPath);
            throw $e;
        }
    }

    public function reject(AttendanceCorrection $correction, string $note): AttendanceCorrection {
        return DB::transaction(function () use ($correction, $note) {
            $correction = $this->lockPending($correction);
            $before = $this->audit->snapshot($correction);
            $correction->update(['status' => 'REJECTED', 'reviewed_by' => Auth::id(), 'reviewed_at' => now(), 'review_note' => $note]);
            $this->audit->record($correction, 'REJECTED', $before, $note);
            return $correction->refresh();
        });
    }

    private function lockPending(AttendanceCorrection $correction): AttendanceCorrection {
        $locked = AttendanceCorrection::whereKey($correction->getKey())->lockForUpdate()->firstOrFail();
        if ($locked->status !== 'PENDING') {
            throw ValidationException::withMessages(['status' => ['Koreksi ini sudah diputuskan.']]);
        }
        return $locked;
    }

    private function applyAttendance(AttendanceCorrection $correction): void {
        $record = StudentAttendance::where('session_id', $correction->session_id)->where('student_id', $correction->student_id)->lockForUpdate()->first();
        $values = [
            'attendance_status' => $correction->new_status,
            'note'              => 'Koreksi: ' . $correction->reason,
            'checked_in_at'     => $correction->new_status === 'HADIR' ? ($record?->checked_in_at ?? null) : null,
        ];
        $record
            ? $record->update($values)
            : StudentAttendance::create($values + ['session_id' => $correction->session_id, 'student_id' => $correction->student_id]);
    }

    private function resolveOverbilling(Invoice $invoice, AttendanceCorrection $correction, array $billing, ?string $resolution, array $data, ?string $proofPath): array {
        $results = [];
        $label = 'Koreksi absensi ' . $this->sessionLabel($correction);

        if ($billing['unpaid_portion'] > 0) {
            $credit = CreditNote::create([
                'student_id' => $invoice->student_id, 'source_invoice_id' => $invoice->id, 'correction_id' => $correction->id,
                'amount' => $billing['unpaid_portion'], 'remaining_amount' => 0, 'note' => "{$label}: kelebihan tagih yang belum dibayar", 'created_by' => Auth::id(),
            ]);
            CreditApplication::create(['credit_note_id' => $credit->id, 'invoice_id' => $invoice->id, 'amount' => $billing['unpaid_portion'], 'created_by' => Auth::id()]);
            $results['credit_applied_to_invoice'] = $billing['unpaid_portion'];
        }

        if ($billing['paid_portion'] > 0 && $resolution === 'REFUND') {
            $refund = Refund::create([
                'student_id' => $invoice->student_id, 'invoice_id' => $invoice->id, 'correction_id' => $correction->id,
                'amount' => $billing['paid_portion'], 'method' => $data['refund_method'], 'reference_no' => $data['refund_reference_no'] ?? null,
                'proof_path' => $proofPath, 'paid_by' => Auth::id(), 'paid_at' => now(), 'note' => $label,
            ]);
            $results['refund'] = ['id' => $refund->id, 'amount' => $billing['paid_portion']];
        } elseif ($billing['paid_portion'] > 0) {
            $credit = CreditNote::create([
                'student_id' => $invoice->student_id, 'source_invoice_id' => $invoice->id, 'correction_id' => $correction->id,
                'amount' => $billing['paid_portion'], 'remaining_amount' => $billing['paid_portion'],
                'note' => "{$label}: kredit untuk tagihan berikutnya", 'created_by' => Auth::id(),
            ]);
            $results['credit_balance'] = ['id' => $credit->id, 'amount' => $billing['paid_portion']];
        }

        $this->invoices->recalculate($invoice);
        return $results;
    }

    /** Sesi dengan absensi satu siswa diganti di memori (tidak disimpan) untuk menghitung "sesudah koreksi". */
    private function withStatus(Collection $sessions, string $sessionId, string $studentId, string $status): Collection {
        return $sessions->map(function ($session) use ($sessionId, $studentId, $status) {
            if ($session->id !== $sessionId) return $session;
            $copy = clone $session;
            $attendances = $session->studentAttendances->map(fn($a) => clone $a);
            $target = $attendances->firstWhere('student_id', $studentId);
            $target
                ? $target->attendance_status = $status
                : $attendances->push(new StudentAttendance(['session_id' => $sessionId, 'student_id' => $studentId, 'attendance_status' => $status]));
            $copy->setRelation('studentAttendances', $attendances);
            return $copy;
        });
    }

    /** Selisih kuantitas per aturan tarif × tarif snapshot di item tagihan (bukan tarif aktif). */
    private function billingDelta(array $before, array $after, Collection $invoiceItems): array {
        $key = fn($item) => $item['fee_rule_id'] ?? $item['calc_method'];
        $before = collect($before)->keyBy($key);
        $after = collect($after)->keyBy($key);

        return $before->keys()->merge($after->keys())->unique()->map(function ($k) use ($before, $after, $invoiceItems) {
            $deltaQty = round((float) ($after->get($k)['quantity'] ?? 0) - (float) ($before->get($k)['quantity'] ?? 0), 2);
            if ($deltaQty == 0) return null;
            $source = $after->get($k) ?? $before->get($k);
            $snapshot = $invoiceItems->first(fn($i) => ($i->fee_rule_id ?? $i->calc_method) === $k);
            $price = (float) ($snapshot?->unit_price ?? $source['unit_price']);
            return [
                'key'         => $k,
                'name'        => preg_replace('/\s*\(.*\)$/', '', $source['item_name']),
                'calc_method' => $source['calc_method'],
                'fee_rule_id' => $source['fee_rule_id'],
                'quantity'    => $deltaQty,
                'unit_price'  => $price,
                'amount'      => round($deltaQty * $price, 2),
            ];
        })->filter()->values()->all();
    }

    private function adjustmentItems(AttendanceCorrection $correction, array $lines): array {
        $change = (self::LABELS[$correction->old_status] ?? $correction->old_status) . ' → ' . (self::LABELS[$correction->new_status] ?? $correction->new_status);
        return collect($lines)->filter(fn($l) => $l['amount'] > 0)->map(fn($l) => [
            'item_type'   => 'SERVICE',
            'item_name'   => "{$l['name']} (koreksi absensi " . $this->sessionLabel($correction) . ')',
            'description' => "Absensi {$change}: {$correction->reason}",
            'quantity'    => $l['quantity'],
            'unit_price'  => $l['unit_price'],
            'fee_rule_id' => $l['fee_rule_id'],
            'calc_method' => $l['calc_method'],
        ])->values()->all();
    }

    private function sessionLabel(AttendanceCorrection $correction): string {
        return Carbon::parse($correction->session?->session_date)->locale('id')->translatedFormat('d M Y');
    }

    private function notify(AttendanceCorrection $correction, ?array $billing, ?array $payroll, array $results): void {
        try {
            $session = $this->sessionLabel($correction);
            if ($billing && $billing['delta'] != 0) {
                $detail = match (true) {
                    isset($results['adjustment_invoice_no']) => "Tagihan penyesuaian {$results['adjustment_invoice_no']} sebesar " . Pdf::rupiah($billing['delta']) . ' diterbitkan.',
                    isset($results['refund']) => 'Kelebihan tagihan ' . Pdf::rupiah($results['refund']['amount']) . ' dikembalikan.',
                    isset($results['credit_balance']) => 'Kelebihan tagihan ' . Pdf::rupiah($results['credit_balance']['amount']) . ' menjadi kredit untuk tagihan berikutnya.',
                    default => 'Sisa tagihan ' . $billing['invoice_no'] . ' dikurangi ' . Pdf::rupiah(abs($billing['delta'])) . '.',
                };
                foreach ($correction->student()->with('parents.user')->first()?->parents->pluck('user')->filter() ?? [] as $user) {
                    $user->notify(new PortalNotification('attendance_corrected', 'Koreksi absensi & tagihan', "Absensi {$session} dikoreksi. {$detail}", ['Alasan' => $correction->reason], '/parent/billing'));
                }
            }
            if ($payroll && isset($results['payroll_adjustment'])) {
                $tentorUser = \App\Models\Admin\Tentor::with('user')->find($payroll['tentor_id'])?->user;
                $amount = Pdf::rupiah($results['payroll_adjustment']['amount']);
                $message = match ($results['payroll_adjustment']['kind']) {
                    'ADDITION'  => "honor {$amount} ditambahkan pada payroll berikutnya.",
                    'DEDUCTION' => "kelebihan honor {$amount} dipotong dari payroll berikutnya.",
                    'RECOVERY'  => "kelebihan honor {$amount} perlu dikembalikan. Admin akan menghubungi Anda.",
                };
                $tentorUser?->notify(new PortalNotification('honor_adjusted', 'Penyesuaian honor', "Koreksi absensi {$session}: {$message}", ['Alasan' => $correction->reason], '/tentor/honor'));
            }
        } catch (Throwable $e) {
            Log::warning('Notifikasi koreksi absensi gagal', ['correction' => $correction->id, 'error' => $e->getMessage()]);
        }
    }
}
