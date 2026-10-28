<?php
namespace App\Http\Controllers\Api\ParentPortal;

use App\Support\Pdf;
use App\Http\Controllers\Api\Finance\PaymentController;
use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\ParentPaymentRequest;
use App\Http\Resources\Finance\InvoiceResource;
use App\Http\Resources\Finance\PaymentResource;
use App\Models\Admin\ParentModel;
use App\Models\Finance\Invoice;
use App\Models\Finance\Payment;
use App\Services\Finance\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Tagihan & pembayaran untuk orang tua: hanya data anak-anaknya sendiri.
 */
class ParentBillingController extends Controller {

    public function __construct(protected PaymentService $paymentService) {}

    // GET: Tagihan anak-anak
    public function invoices(Request $request) {
        $query = Invoice::query()
            ->whereIn('student_id', $this->childIds())
            ->where('status', '!=', 'CANCELLED')
            ->with(['student', 'classroom', 'package', 'paymentDetails.payment'])
            ->withCount(['paymentDetails as pending_payments_count' => fn($q) => $q->whereHas('payment', fn($p) => $p->where('status', 'PENDING'))]);

        if ($request->filled('status')) {
            $status = strtoupper($request->status);
            $status === 'OPEN'
                ? $query->whereIn('status', ['UNPAID', 'PARTIAL'])
                : $query->where('status', $status);
        }

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->student_id);
        }

        $invoices = $query->orderByRaw("CASE WHEN status IN ('UNPAID','PARTIAL') THEN 0 ELSE 1 END")
            ->orderByDesc('issue_date')
            ->get();

        $open = $invoices->whereIn('status', ['UNPAID', 'PARTIAL']);

        return response()->json([
            'success'  => true,
            'data'     => InvoiceResource::collection($invoices),
            'summary'  => [
                'outstanding'   => (float) $open->sum('remaining_amount'),
                'open_count'    => $open->count(),
                'overdue_count' => $open->filter(fn($i) => $i->isOverdue())->count(),
            ],
            'children' => $this->parent()->students()->get(['master.students.id', 'full_name'])->map(fn($s) => ['id' => $s->id, 'name' => $s->full_name]),
        ]);
    }

    public function showInvoice($id) {
        $invoice = Invoice::whereIn('student_id', $this->childIds())
            ->with(['student', 'classroom', 'package', 'items', 'paymentDetails.payment'])
            ->withCount(['paymentDetails as pending_payments_count' => fn($q) => $q->whereHas('payment', fn($p) => $p->where('status', 'PENDING'))])
            ->findOrFail($id);

        return response()->json(['success' => true, 'data' => new InvoiceResource($invoice)]);
    }

    // GET: Invoice PDF tagihan anak
    public function invoicePdf($id) {
        $invoice = Invoice::whereIn('student_id', $this->childIds())
            ->with(['student.parents', 'classroom', 'items', 'paymentDetails.payment'])
            ->findOrFail($id);

        return Pdf::download('pdf.invoice', compact('invoice'), "Invoice-{$invoice->invoice_no}.pdf");
    }

    // POST: Kirim bukti transfer untuk satu tagihan
    public function submitPayment(ParentPaymentRequest $request, $id) {
        $invoice = Invoice::whereIn('student_id', $this->childIds())->findOrFail($id);
        $data = $request->validated();

        $payment = $this->paymentService->submitByParent($invoice, $data, $request->file('proof'));

        return response()->json([
            'success' => true,
            'message' => 'Bukti pembayaran terkirim. Admin akan memverifikasi dalam 1x24 jam.',
            'data'    => new PaymentResource($payment->load('details.invoice')),
        ]);
    }

    // GET: Riwayat pembayaran
    public function payments() {
        $payments = Payment::whereIn('student_id', $this->childIds())
            ->with(['student', 'details.invoice'])
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['success' => true, 'data' => PaymentResource::collection($payments)]);
    }

    public function proof($id) {
        $payment = Payment::whereIn('student_id', $this->childIds())->findOrFail($id);

        return PaymentController::streamProof($payment);
    }

    private function parent(): ParentModel {
        $parent = ParentModel::where('user_id', Auth::id())->first();
        abort_unless($parent, 403, 'Akun ini tidak terhubung dengan data orang tua.');
        return $parent;
    }

    private function childIds(): array {
        return $this->parent()->students()->pluck('master.students.id')->all();
    }
}
