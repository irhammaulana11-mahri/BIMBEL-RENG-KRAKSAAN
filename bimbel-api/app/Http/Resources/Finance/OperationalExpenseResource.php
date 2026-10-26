<?php

namespace App\Http\Resources\Finance;

use App\Models\Finance\OperationalExpense;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OperationalExpenseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'expense_date'   => $this->expense_date?->format('Y-m-d'),
            'category'       => $this->category,
            'category_label' => OperationalExpense::CATEGORIES[$this->category] ?? $this->category,
            'title'          => $this->title,
            'amount'         => (float) $this->amount,
            'payment_method' => $this->payment_method,
            'note'           => $this->note,
        ];
    }
}
