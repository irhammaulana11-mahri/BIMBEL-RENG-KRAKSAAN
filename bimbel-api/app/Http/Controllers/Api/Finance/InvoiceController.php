<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\GenerateInvoiceRequest;
use App\Http\Requests\Finance\InvoiceRequest;
use App\Http\Resources\Finance\InvoiceResource;
use App\Models\Finance\Invoice;
use App\Services\Finance\InvoiceService;
use App\Support\LocalTime;
use Illuminate\Http\Request;

/**
 * Tagihan siswa (Admin).
 */
class InvoiceController extends Controller
{
    public function __construct(protected InvoiceService $invoiceService) {}

    public function index(Request $request)
    {
        $query = Invoice::query()
            ->with(['student.parents', 'classroom', 'package'])
            ->withCount(['paymentDetails as pending_payments_count' => fn($q) => $q->whereHas('payment', fn($p) => $p->where('status', 'PENDING'))]);

        if ($request->filled('period')) {
            $query->where('period_year', (int) substr($request->period, 0, 4))
                  ->where('period_month', (int) substr($request->period, 5, 2));
        }

        if ($request->filled('status')) {
            $status = strtoupper($request->status);
            $status === 'OPEN'
                ? $query->whereIn('status', ['UNPAID', 'PARTIAL'])
                : $query->where('status', $status);
        }

        if ($request->boolean('overdue')) {
            $query->whereIn('status', ['UNPAID', 'PARTIAL'])->whereDate('due_date', '<', LocalTime::today());
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        if ($request->filled('class_id')) {
            $query->where('class_id', $request->class_id);
        }

        if ($request->filled('keyword')) {
            $kw = '%' . trim($request->keyword) . '%';
            $query->where(fn($q) => $q
                ->where('invoice_no', 'ILIKE', $kw)
                ->orWhereHas('student', fn($sq) => $sq->where('full_name', 'ILIKE', $kw))
                ->orWhereHas('student.parents', fn($sq) => $sq->where('full_name', 'ILIKE', $kw)));
        }

        // Ringkasan mengikuti filter periode (bukan halaman)
        $summaryQuery = (clone $query)->where('status', '!=', 'CANCELLED');
        $summary = [
            'total_amount'     => (float) (clone $summaryQuery)->sum('total_amount'),
            'paid_amount'      => (float) (clone $summaryQuery)->sum('paid_amount'),
            'remaining_amount' => (float) (clone $summaryQuery)->sum('remaining_amount'),
            'count'            => (clone $summaryQuery)->count(),
            'paid_count'       => (clone $summaryQuery)->where('status', 'PAID')->count(),
        ];

        $perPage = min(max($request->integer('per_page', 15), 1), 100);
        $invoices = $query->orderByDesc('issue_date')->orderBy('invoice_no')->paginate($perPage)->withQueryString();

        return InvoiceResource::collection($invoices)->additional(['summary' => $summary]);
    }

    public function show(Invoice $invoice)
    {
        return new InvoiceResource($invoice->load(['student.parents', 'classroom', 'package', 'items', 'paymentDetails.payment']));
    }

    public function store(InvoiceRequest $request)
    {
        $invoice = $this->invoiceService->createManual($request->validated());

        return new InvoiceResource($invoice->load(['student', 'classroom', 'package', 'items']));
    }

    // POST: Buat tagihan bulanan seluruh siswa kelas aktif
    public function generate(GenerateInvoiceRequest $request)
    {
        $data = $request->validated();
        $result = $this->invoiceService->generateMonthly(
            (int) substr($data['period'], 0, 4),
            (int) substr($data['period'], 5, 2),
            $data['due_date'],
            $data['class_ids'] ?? null,
        );

        $message = "{$result['created']} tagihan dibuat";
        if ($result['skipped'] > 0) $message .= ", {$result['skipped']} sudah ada sebelumnya";
        if ($result['without_package']) $message .= '. Kelas tanpa paket dilewati: ' . implode(', ', $result['without_package']);

        return response()->json(['message' => $message . '.', 'data' => $result]);
    }

    public function cancel(Request $request, Invoice $invoice)
    {
        $data = $request->validate(['reason' => ['required', 'string', 'max:500']]);
        $invoice = $this->invoiceService->cancel($invoice, $data['reason']);

        return (new InvoiceResource($invoice->load(['student', 'classroom', 'package'])))
            ->additional(['message' => 'Tagihan dibatalkan.']);
    }
}
