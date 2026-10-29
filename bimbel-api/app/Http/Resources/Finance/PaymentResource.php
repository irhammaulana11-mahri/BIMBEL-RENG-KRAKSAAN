<?php

namespace App\Http\Resources\Finance;

use App\Support\LocalTime;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'              => $this->id,
            'payment_no'      => $this->payment_no,
            'student_id'      => $this->student_id,
            'student_name'    => $this->whenLoaded('student', fn() => $this->student->full_name),
            'payment_date'    => $this->payment_date?->format('Y-m-d'),
            'payment_method'  => $this->payment_method,
            'payment_channel' => $this->payment_channel,
            'reference_no'    => $this->reference_no,
            'total_amount'    => (float) $this->total_amount,
            'status'          => $this->status,
            'note'            => $this->note,
            'reject_reason'   => $this->reject_reason,
            'has_proof'       => (bool) $this->payment_proof,
            'submitted_by'    => $this->whenLoaded('submitter', fn() => $this->submitter?->name),
            'received_by'     => $this->whenLoaded('receiver', fn() => $this->receiver?->name),
            'confirmed_at'    => LocalTime::format($this->confirmed_at, 'Y-m-d H:i'),
            'created_at'      => LocalTime::format($this->created_at, 'Y-m-d H:i'),
            // Status asli tetap CONFIRMED; reversal terakhir (diajukan/disetujui/ditolak) ditampilkan terpisah
            'reversed'        => $this->whenLoaded('reversals', fn() => $this->reversals->contains('status', 'APPROVED')),
            'reversal'        => $this->whenLoaded('reversals', fn() => ($r = $this->reversals->sortByDesc('requested_at')->first()) ? [
                'id'            => $r->id,
                'status'        => $r->status,
                'reason'        => $r->reason,
                'amount'        => (float) $r->amount,
                'requested_at'  => LocalTime::format($r->requested_at, 'Y-m-d H:i'),
                'approved_at'   => LocalTime::format($r->approved_at, 'Y-m-d H:i'),
                'self_approved' => $r->self_approved,
                'reject_note'   => $r->reject_note,
            ] : null),
            'invoices'        => $this->whenLoaded('details', fn() => $this->details->map(fn($detail) => [
                'invoice_id'       => $detail->invoice_id,
                'invoice_no'       => $detail->relationLoaded('invoice') ? $detail->invoice?->invoice_no : null,
                'remaining_amount' => $detail->relationLoaded('invoice') ? (float) $detail->invoice?->remaining_amount : null,
                'amount'           => (float) $detail->amount_paid,
            ])),
        ];
    }
}
