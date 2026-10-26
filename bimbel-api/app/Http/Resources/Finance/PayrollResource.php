<?php

namespace App\Http\Resources\Finance;

use App\Support\LocalTime;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PayrollResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                     => $this->id,
            'payroll_no'             => $this->payroll_no,
            'period_month'           => $this->period_month,
            'period_year'            => $this->period_year,
            'period_label'           => Carbon::create($this->period_year, $this->period_month, 1)->locale('id')->translatedFormat('F Y'),
            'payroll_date'           => $this->payroll_date?->format('Y-m-d'),
            'total_tutors'           => $this->total_tutors,
            'total_sessions'         => $this->total_sessions,
            'total_teaching_minutes' => $this->total_teaching_minutes,
            'total_amount'           => (float) $this->total_amount,
            'paid_tutors'            => $this->whenCounted('transfers', fn() => $this->transfers_count),
            'status'                 => $this->status,
            'note'                   => $this->note,
            'approved_at'            => LocalTime::format($this->approved_at, 'Y-m-d H:i'),
            'paid_at'                => LocalTime::format($this->paid_at, 'Y-m-d H:i'),
        ];
    }
}
