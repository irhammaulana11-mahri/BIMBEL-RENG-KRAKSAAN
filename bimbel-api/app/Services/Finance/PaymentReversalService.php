<?php

namespace App\Services\Finance;

use App\Models\Finance\Invoice;
use App\Models\Finance\Payment;
use App\Models\Finance\PaymentReversal;
use App\Notifications\PortalNotification;
use App\Support\Pdf;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Throwable;

/**
 * Pembatalan pembayaran CONFIRMED lewat reversal (D-02). Pembayaran asli tidak dihapus dan statusnya
 * tetap CONFIRMED; reversal yang disetujui membuatnya tidak lagi dihitung pada tagihan.
 *
 * Persetujuan mengikuti mode keuangan (D-11, config finance.approval_mode):
 * - single_operator: password wajib dikonfirmasi ulang; menyetujui pengajuan sendiri butuh alasan tertulis
 *   dan ditandai self_approved.
 * - separated: penyetuju harus akun yang berbeda dari pengaju.
 */
class PaymentReversalService
{
    public const MIN_NOTE_LENGTH = 10;

    public function __construct(protected InvoiceService $invoiceService, protected FinanceAudit $audit) {}

    public function request(Payment $payment, string $reason): PaymentReversal {
        return DB::transaction(function () use ($payment, $reason) {
            $payment = Payment::whereKey($payment->getKey())->lockForUpdate()->firstOrFail();
            if ($payment->status !== 'CONFIRMED') {
                throw ValidationException::withMessages(['payment' => ['Hanya pembayaran yang sudah dikonfirmasi yang dapat dibatalkan dengan reversal.']]);
            }
            if ($payment->reversals()->whereIn('status', ['PENDING', 'APPROVED'])->exists()) {
                throw ValidationException::withMessages(['payment' => ['Pembayaran ini sudah memiliki reversal yang diajukan atau disetujui.']]);
            }

            $reversal = PaymentReversal::create([
                'payment_id'   => $payment->id,
                'amount'       => $payment->total_amount,
                'reason'       => $reason,
                'status'       => 'PENDING',
                'requested_by' => Auth::id(),
                'requested_at' => now(),
            ]);
            $this->audit->record($reversal, 'REQUESTED', reason: $reason, meta: ['payment_no' => $payment->payment_no]);

            return $reversal;
        });
    }

    public function approve(PaymentReversal $reversal, ?string $password, ?string $note): PaymentReversal {
        return DB::transaction(function () use ($reversal, $password, $note) {
            $reversal = $this->lockPending($reversal);
            $user = Auth::user();
            $mode = config('finance.approval_mode');
            $selfApproved = $reversal->requested_by === $user->id;

            if ($mode === 'separated' && $selfApproved) {
                throw ValidationException::withMessages(['approval' => ['Reversal harus disetujui oleh akun yang berbeda dari pengaju.']]);
            }
            if ($mode !== 'separated') {
                if (!$password || !Hash::check($password, $user->password)) {
                    throw ValidationException::withMessages(['password' => ['Password tidak sesuai.']]);
                }
                if ($selfApproved && mb_strlen(trim((string) $note)) < self::MIN_NOTE_LENGTH) {
                    throw ValidationException::withMessages(['note' => ['Tulis alasan persetujuan minimal ' . self::MIN_NOTE_LENGTH . ' karakter karena Anda juga pengaju reversal ini.']]);
                }
            }

            $payment = Payment::whereKey($reversal->payment_id)->lockForUpdate()->firstOrFail();
            $before = $this->audit->snapshot($reversal);

            $reversal->update([
                'status'        => 'APPROVED',
                'approved_by'   => $user->id,
                'approved_at'   => now(),
                'approval_note' => $note,
                'self_approved' => $selfApproved,
            ]);

            $invoices = Invoice::whereIn('id', $payment->details()->pluck('invoice_id'))->orderBy('id')->lockForUpdate()->get();
            foreach ($invoices as $invoice) $this->invoiceService->recalculate($invoice);

            $meta = ['approval_mode' => $mode, 'self_approved' => $selfApproved];
            $this->audit->record($reversal, 'APPROVED', $before, $note, $meta);
            $this->audit->record($payment, 'REVERSED', reason: $reversal->reason, meta: $meta + ['reversal_id' => $reversal->id]);

            DB::afterCommit(fn() => $this->notifyParents($payment, $reversal));

            return $reversal->refresh();
        });
    }

    public function reject(PaymentReversal $reversal, string $note): PaymentReversal {
        return DB::transaction(function () use ($reversal, $note) {
            $reversal = $this->lockPending($reversal);
            $before = $this->audit->snapshot($reversal);

            $reversal->update([
                'status'      => 'REJECTED',
                'rejected_by' => Auth::id(),
                'rejected_at' => now(),
                'reject_note' => $note,
            ]);
            $this->audit->record($reversal, 'REJECTED', $before, $note);

            return $reversal->refresh();
        });
    }

    private function lockPending(PaymentReversal $reversal): PaymentReversal {
        $locked = PaymentReversal::whereKey($reversal->getKey())->lockForUpdate()->firstOrFail();
        if ($locked->status !== 'PENDING') {
            throw ValidationException::withMessages(['status' => ['Reversal ini sudah diputuskan.']]);
        }
        return $locked;
    }

    /** Verifikasi pihak luar (D-11): orang tua diberi tahu setiap pembatalan pembayarannya. */
    private function notifyParents(Payment $payment, PaymentReversal $reversal): void {
        try {
            $parents = $payment->student()->with('parents.user')->first()?->parents->pluck('user')->filter();
            foreach ($parents ?? [] as $user) {
                $user->notify(new PortalNotification(
                    'payment_reversed',
                    'Pembayaran dibatalkan',
                    "Pembayaran {$payment->payment_no} sebesar " . Pdf::rupiah($reversal->amount) . ' dibatalkan oleh admin. Tagihan terkait dihitung ulang.',
                    ['Alasan' => $reversal->reason],
                    '/parent/billing',
                ));
            }
        } catch (Throwable $e) {
            Log::warning('Notifikasi reversal gagal', ['reversal' => $reversal->id, 'error' => $e->getMessage()]);
        }
    }
}
