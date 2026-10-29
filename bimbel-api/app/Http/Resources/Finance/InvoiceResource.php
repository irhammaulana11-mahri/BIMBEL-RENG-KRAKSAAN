<?php

namespace App\Http\Resources\Finance;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class InvoiceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $student = $this->relationLoaded('student') ? $this->student : null;

        return [
            'id'               => $this->id,
            'invoice_no'       => $this->invoice_no,
            'student_id'       => $this->student_id,
            'student_name'     => $student?->full_name,
            'student_nis'      => $student?->nis,
            'parent_names'     => $student && $student->relationLoaded('parents') ? $student->parents->pluck('full_name')->values() : null,
            'class_id'         => $this->class_id,
            'class_name'       => $this->whenLoaded('classroom', fn() => $this->classroom->name),
            'package_name'     => $this->whenLoaded('package', fn() => $this->package->package_name),
            'period_month'     => $this->period_month,
            'period_year'      => $this->period_year,
            'issue_date'       => $this->issue_date?->format('Y-m-d'),
            'due_date'         => $this->due_date?->format('Y-m-d'),
            'subtotal'         => (float) $this->subtotal,
            'discount'         => (float) $this->discount,
            'total_amount'     => (float) $this->total_amount,
            'paid_amount'      => (float) $this->paid_amount,
            'remaining_amount' => (float) $this->remaining_amount,
            'status'           => $this->status,
            'is_overdue'       => $this->isOverdue(),
            'has_pending_payment' => $this->when(isset($this->pending_payments_count), fn() => $this->pending_payments_count > 0),
            'note'             => $this->note,
            'cancel_reason'    => $this->cancel_reason,
            'items'            => $this->whenLoaded('items', fn() => $this->items->map(fn($item) => [
                'id'          => $item->id,
                'item_type'   => $item->item_type,
                'item_name'   => $item->item_name,
                'description' => $item->description,
                'quantity'    => $item->quantity,
                'unit_price'  => (float) $item->unit_price,
                'discount'    => (float) $item->discount,
                'subtotal'    => (float) $item->subtotal,
            ])),
            'payments'         => $this->whenLoaded('paymentDetails', fn() => $this->paymentDetails
                ->filter(fn($detail) => $detail->relationLoaded('payment') && $detail->payment)
                ->sortByDesc(fn($detail) => $detail->payment->created_at)
                ->values()
                ->map(fn($detail) => [
                    'payment_id'     => $detail->payment_id,
                    'payment_no'     => $detail->payment->payment_no,
                    'payment_date'   => $detail->payment->payment_date?->format('Y-m-d'),
                    'payment_method' => $detail->payment->payment_method,
                    'amount'         => (float) $detail->amount_paid,
                    'status'         => $detail->payment->status,
                    'reject_reason'  => $detail->payment->reject_reason,
                    'has_proof'      => (bool) $detail->payment->payment_proof,
                    // Status asli tetap CONFIRMED; reversed = dibatalkan lewat reversal yang disetujui
                    'reversed'        => $detail->payment->relationLoaded('approvedReversal') && $detail->payment->approvedReversal !== null,
                    'reversal_reason' => $detail->payment->relationLoaded('approvedReversal') ? $detail->payment->approvedReversal?->reason : null,
                ])),
            // Tagihan penyesuaian (koreksi absensi) & kredit/refund atas kelebihan tagih
            'invoice_type'     => $this->invoice_type,
            'adjusts_invoice_no' => $this->whenLoaded('adjustedInvoice', fn() => $this->adjustedInvoice?->invoice_no),
            'credit_applied'   => $this->whenLoaded('creditApplications', fn() => (float) $this->creditApplications->sum('amount')),
            'refunds'          => $this->whenLoaded('refunds', fn() => $this->refunds->map(fn($r) => [
                'amount' => (float) $r->amount, 'method' => $r->method, 'reference_no' => $r->reference_no, 'paid_at' => $r->paid_at?->format('Y-m-d'),
            ])),
            'created_at'       => $this->created_at,
        ];
    }
}
