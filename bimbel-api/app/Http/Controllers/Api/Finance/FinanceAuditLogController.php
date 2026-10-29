<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Models\Finance\FinanceAuditLog;
use App\Services\Finance\FinanceAudit;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Jejak audit keuangan (Admin, hanya baca).
 */
class FinanceAuditLogController extends Controller
{
    public function index(Request $request)
    {
        $filters = $request->validate([
            'entity_type' => ['nullable', Rule::in(array_values(FinanceAudit::ENTITY_TYPES))],
            'entity_id'   => ['nullable', 'uuid'],
            'actor_id'    => ['nullable', 'uuid'],
            'action'      => ['nullable', 'string', 'max:50'],
            'date_from'   => ['nullable', 'date'],
            'date_to'     => ['nullable', 'date', 'after_or_equal:date_from'],
            'per_page'    => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $logs = FinanceAuditLog::query()
            ->when($filters['entity_type'] ?? null, fn($q, $v) => $q->where('entity_type', $v))
            ->when($filters['entity_id'] ?? null, fn($q, $v) => $q->where('entity_id', $v))
            ->when($filters['actor_id'] ?? null, fn($q, $v) => $q->where('actor_id', $v))
            ->when($filters['action'] ?? null, fn($q, $v) => $q->where('action', strtoupper($v)))
            ->when($filters['date_from'] ?? null, fn($q, $v) => $q->where('created_at', '>=', $v))
            ->when($filters['date_to'] ?? null, fn($q, $v) => $q->where('created_at', '<', \Carbon\Carbon::parse($v)->addDay()))
            ->orderByDesc('created_at')->orderByDesc('id')
            ->paginate($filters['per_page'] ?? 50)
            ->withQueryString();

        return response()->json(['success' => true] + $logs->toArray());
    }
}
