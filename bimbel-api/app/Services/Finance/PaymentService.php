<?php
namespace App\Services\Finance;

use App\Models\Finance\Invoice;
use App\Models\Finance\Payment;
use App\Models\Finance\PaymentDetail;
use App\Support\LocalTime;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

/**
 * Pembayaran tagihan siswa.
 * - Orang tua upload bukti transfer  -> PENDING -> Admin CONFIRMED / REJECTED
 * - Admin mencatat langsung (tunai)  -> CONFIRMED
 * Tagihan hanya berkurang oleh pembayaran CONFIRMED.
 */
class PaymentService {

    // Bukti bayar disimpan di disk privat, dibuka lewat endpoint ber-otorisasi
    public const PROOF_DISK = 'local';
    public const PROOF_FOLDER = 'payment-proofs';

    public function __construct(protected InvoiceService $invoiceService, protected FinanceAudit $audit) {}

    /**
     * Admin mencatat pembayaran (langsung terkonfirmasi).
     * $allocations: [['invoice_id' => ..., 'amount' => ...]] milik siswa yang sama.
     */
    public function recordByAdmin(array $data): Payment {
        return DB::transaction(function () use ($data) {
            $invoices = $this->lockInvoices($data['student_id'], collect($data['allocations'])->pluck('invoice_id')->all());
            $this->ensureNoPendingPayment($invoices);

            foreach ($data['allocations'] as $allocation) {
                $this->ensureAmountAllowed($invoices[$allocation['invoice_id']], (float) $allocation['amount']);
            }

            $payment = $this->createPayment([
                'student_id'      => $data['student_id'],
                'payment_date'    => $data['payment_date'],
                'payment_method'  => $data['payment_method'],
                'payment_channel' => $data['payment_channel'] ?? null,
                'reference_no'    => $data['reference_no'] ?? null,
                'note'            => $data['note'] ?? null,
                'status'          => 'CONFIRMED',
                'received_by'     => Auth::id(),
                'confirmed_at'    => now(),
            ], $data['allocations']);

            foreach ($invoices as $invoice) $this->invoiceService->recalculate($invoice);
            $this->audit->record($payment, 'RECORDED', meta: ['allocations' => $data['allocations']]);

            return $payment;
        });
    }

    /**
     * Orang tua mengirim bukti transfer untuk satu tagihan.
     */
    public function submitByParent(Invoice $invoice, array $data, UploadedFile $proof): Payment {
        $path = $proof->store(self::PROOF_FOLDER, self::PROOF_DISK);

        try {
            return DB::transaction(function () use ($invoice, $data, $path) {
                // Status & PENDING dicek setelah tagihan dikunci: dua pengajuan bersamaan diproses bergantian
                $locked = $this->lockInvoices($invoice->student_id, [$invoice->id])[$invoice->id];
                if (!in_array($locked->status, ['UNPAID', 'PARTIAL'])) {
                    throw ValidationException::withMessages(['invoice' => ['Tagihan ini tidak dapat dibayar.']]);
                }
                $this->ensureNoPendingPayment(collect([$locked]));
                $this->ensureAmountAllowed($locked, (float) $data['amount']);

                $payment = $this->createPayment([
                    'student_id'      => $locked->student_id,
                    'payment_date'    => $data['payment_date'],
                    'payment_method'  => 'TRANSFER',
                    'payment_channel' => $data['payment_channel'] ?? null,
                    'reference_no'    => $data['reference_no'] ?? null,
                    'note'            => $data['note'] ?? null,
                    'payment_proof'   => $path,
                    'status'          => 'PENDING',
                    'submitted_by'    => Auth::id(),
                ], [['invoice_id' => $locked->id, 'amount' => $data['amount']]]);
                $this->audit->record($payment, 'SUBMITTED', meta: ['invoice_id' => $locked->id]);

                return $payment;
            });
        } catch (\Throwable $e) {
            Storage::disk(self::PROOF_DISK)->delete($path);
            throw $e;
        }
    }

    public function approve(Payment $payment): Payment {
        return DB::transaction(function () use ($payment) {
            $payment = $this->lockPendingPayment($payment);
            $before = $this->audit->snapshot($payment);
            $details = $payment->details()->get();
            $invoices = $this->lockInvoices($payment->student_id, $details->pluck('invoice_id')->all());

            foreach ($details as $detail) {
                $this->ensureAmountAllowed($invoices[$detail->invoice_id], (float) $detail->amount_paid);
            }

            $payment->update([
                'status'       => 'CONFIRMED',
                'received_by'  => Auth::id(),
                'confirmed_at' => now(),
            ]);
            $payment->details()->update(['allocated_at' => now()]);

            foreach ($invoices as $invoice) $this->invoiceService->recalculate($invoice);
            $this->audit->record($payment, 'APPROVED', $before);

            return $payment->refresh();
        });
    }

    public function reject(Payment $payment, string $reason): Payment {
        return DB::transaction(function () use ($payment, $reason) {
            $payment = $this->lockPendingPayment($payment);
            $before = $this->audit->snapshot($payment);

            $payment->update([
                'status'        => 'REJECTED',
                'reject_reason' => $reason,
                'received_by'   => Auth::id(),
            ]);

            $invoices = $this->lockInvoices($payment->student_id, $payment->details()->pluck('invoice_id')->all());
            foreach ($invoices as $invoice) $this->invoiceService->recalculate($invoice);
            $this->audit->record($payment, 'REJECTED', $before, $reason);

            return $payment->refresh();
        });
    }

    private function createPayment(array $attributes, array $allocations): Payment {
        $prefix = 'PAY-' . str_replace('-', '', LocalTime::today()) . '-';

        $payment = Payment::create(array_merge($attributes, [
            'payment_no'   => DocumentNumber::next('finance.payments', 'payment_no', $prefix),
            'total_amount' => collect($allocations)->sum(fn($a) => (float) $a['amount']),
        ]));

        foreach ($allocations as $allocation) {
            PaymentDetail::create([
                'payment_id'   => $payment->id,
                'invoice_id'   => $allocation['invoice_id'],
                'amount_paid'  => $allocation['amount'],
                'allocated_at' => $attributes['status'] === 'CONFIRMED' ? now() : null,
            ]);
        }

        return $payment;
    }

    /**
     * Kunci baris tagihan agar pembayaran bersamaan tidak melebihi sisa tagihan.
     */
    private function lockInvoices(string $studentId, array $invoiceIds) {
        // Urut id agar dua transaksi yang mengunci beberapa tagihan tidak saling menunggu (deadlock)
        $invoices = Invoice::whereIn('id', $invoiceIds)->orderBy('id')->lockForUpdate()->get()->keyBy('id');

        if ($invoices->count() !== count(array_unique($invoiceIds))) {
            throw ValidationException::withMessages(['allocations' => ['Tagihan tidak ditemukan.']]);
        }
        if ($invoices->contains(fn($invoice) => $invoice->student_id !== $studentId)) {
            throw ValidationException::withMessages(['allocations' => ['Semua tagihan harus milik siswa yang sama.']]);
        }

        return $invoices;
    }

    private function ensureAmountAllowed(Invoice $invoice, float $amount): void {
        if (!in_array($invoice->status, ['UNPAID', 'PARTIAL'])) {
            throw ValidationException::withMessages(['amount' => ["Tagihan {$invoice->invoice_no} sudah lunas atau dibatalkan."]]);
        }
        if ($amount <= 0 || round($amount, 2) > round((float) $invoice->remaining_amount, 2)) {
            $remaining = number_format((float) $invoice->remaining_amount, 0, ',', '.');
            throw ValidationException::withMessages(['amount' => ["Nominal pembayaran {$invoice->invoice_no} melebihi sisa tagihan (Rp {$remaining})."]]);
        }
    }

    /**
     * Kunci baris pembayaran lalu periksa statusnya dari data terbaru, sehingga dua Admin yang
     * memproses pembayaran yang sama bersamaan tidak bisa menyetujui sekaligus menolaknya.
     */
    private function lockPendingPayment(Payment $payment): Payment {
        $locked = Payment::whereKey($payment->getKey())->lockForUpdate()->firstOrFail();
        if ($locked->status !== 'PENDING') {
            throw ValidationException::withMessages(['status' => ['Pembayaran ini sudah diverifikasi.']]);
        }
        return $locked;
    }

    /** Satu tagihan maksimal punya satu pembayaran PENDING. Dipanggil setelah tagihannya dikunci. */
    private function ensureNoPendingPayment($invoices): void {
        $pending = PaymentDetail::whereIn('invoice_id', $invoices->pluck('id'))
            ->whereHas('payment', fn($q) => $q->where('status', 'PENDING'))
            ->pluck('invoice_id');
        if ($pending->isNotEmpty()) {
            $numbers = $invoices->whereIn('id', $pending)->pluck('invoice_no')->implode(', ');
            throw ValidationException::withMessages(['invoice' => ["Masih ada pembayaran yang menunggu verifikasi untuk tagihan {$numbers}."]]);
        }
    }
}
