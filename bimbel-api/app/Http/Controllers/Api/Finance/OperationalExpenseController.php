<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\OperationalExpenseRequest;
use App\Http\Resources\Finance\OperationalExpenseResource;
use App\Models\Finance\OperationalExpense;
use App\Services\Finance\CashflowService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Pengeluaran operasional & laporan arus kas (Admin).
 */
class OperationalExpenseController extends Controller
{
    public function __construct(protected CashflowService $cashflowService) {}

    public function index(Request $request)
    {
        $query = OperationalExpense::query();

        if ($request->filled('period')) {
            $query->whereYear('expense_date', (int) substr($request->period, 0, 4))
                  ->whereMonth('expense_date', (int) substr($request->period, 5, 2));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('keyword')) {
            $query->where('title', 'ILIKE', '%' . trim($request->keyword) . '%');
        }

        $expenses = $query->orderByDesc('expense_date')->orderByDesc('created_at')->get();

        return OperationalExpenseResource::collection($expenses)->additional([
            'categories' => collect(OperationalExpense::CATEGORIES)->map(fn($label, $key) => ['value' => $key, 'label' => $label])->values(),
            'total'      => (float) $expenses->sum('amount'),
        ]);
    }

    public function store(OperationalExpenseRequest $request)
    {
        $expense = OperationalExpense::create(array_merge($request->validated(), ['created_by' => Auth::id()]));

        return (new OperationalExpenseResource($expense))->additional(['message' => 'Pengeluaran dicatat.']);
    }

    public function update(OperationalExpenseRequest $request, OperationalExpense $expense)
    {
        $expense->update($request->validated());

        return (new OperationalExpenseResource($expense))->additional(['message' => 'Pengeluaran diperbarui.']);
    }

    public function destroy(OperationalExpense $expense)
    {
        $expense->delete();

        return response()->json(['message' => 'Pengeluaran dihapus.']);
    }

    // GET: Ringkasan arus kas bulanan
    public function cashflow(Request $request)
    {
        $data = $request->validate(['period' => ['required', 'date_format:Y-m']]);

        return response()->json([
            'data' => $this->cashflowService->summary((int) substr($data['period'], 0, 4), (int) substr($data['period'], 5, 2)),
        ]);
    }
}
