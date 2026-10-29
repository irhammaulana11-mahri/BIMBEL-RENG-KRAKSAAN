<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Models\Finance\Payment;
use App\Models\Finance\PaymentReversal;
use App\Services\Finance\PaymentReversalService;
use App\Support\LocalTime;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

/**
 * Reversal pembayaran (Admin): ajukan, setujui, tolak.
 */
class PaymentReversalController extends Controller
{
    private const RELATIONS = ['payment.student', 'requester', 'approver', 'rejecter'];

    public function __construct(protected PaymentReversalService $service) {}

    public function index(Request $request)
    {
        $data = $request->validate(['status' => ['nullable', Rule::in(PaymentReversal::STATUSES)]]);

        $reversals = PaymentReversal::with(self::RELATIONS)
            ->when($data['status'] ?? null, fn($q, $v) => $q->where('status', $v))
            ->orderByRaw("CASE WHEN status = 'PENDING' THEN 0 ELSE 1 END")
            ->orderByDesc('requested_at')
            ->paginate(min(max($request->integer('per_page', 15), 1), 100))
            ->withQueryString();

        return response()->json([
            'success' => true,
            'data'    => $reversals->getCollection()->map(fn($r) => $this->present($r)),
            'meta'    => ['current_page' => $reversals->currentPage(), 'last_page' => $reversals->lastPage(), 'total' => $reversals->total()],
            'summary' => ['pending' => PaymentReversal::where('status', 'PENDING')->count()],
            // UI: apakah penyetuju boleh akun yang sama (mode operator tunggal)
            'approval_mode' => config('finance.approval_mode'),
        ]);
    }

    public function store(Request $request, Payment $payment)
    {
        $data = $request->validate(['reason' => ['required', 'string', 'min:10', 'max:1000']], [
            'reason.required' => 'Alasan reversal wajib diisi.',
            'reason.min'      => 'Alasan reversal minimal 10 karakter.',
        ]);
        $reversal = $this->service->request($payment, $data['reason']);

        return response()->json(['success' => true, 'message' => 'Reversal diajukan.', 'data' => $this->present($reversal->load(self::RELATIONS))], 201);
    }

    public function approve(Request $request, PaymentReversal $reversal)
    {
        $data = $request->validate([
            'password' => ['nullable', 'string'],
            'note'     => ['nullable', 'string', 'max:1000'],
        ]);
        $reversal = $this->service->approve($reversal, $data['password'] ?? null, $data['note'] ?? null);

        return response()->json(['success' => true, 'message' => 'Reversal disetujui. Tagihan terkait dihitung ulang.', 'data' => $this->present($reversal->load(self::RELATIONS))]);
    }

    public function reject(Request $request, PaymentReversal $reversal)
    {
        $data = $request->validate(['note' => ['required', 'string', 'min:5', 'max:1000']], [
            'note.required' => 'Alasan penolakan wajib diisi.',
        ]);
        $reversal = $this->service->reject($reversal, $data['note']);

        return response()->json(['success' => true, 'message' => 'Reversal ditolak.', 'data' => $this->present($reversal->load(self::RELATIONS))]);
    }

    private function present(PaymentReversal $r): array {
        return [
            'id'            => $r->id,
            'payment_id'    => $r->payment_id,
            'payment_no'    => $r->payment?->payment_no,
            'payment_date'  => $r->payment?->payment_date?->format('Y-m-d'),
            'student_name'  => $r->payment?->student?->full_name,
            'amount'        => (float) $r->amount,
            'reason'        => $r->reason,
            'status'        => $r->status,
            'requested_by'  => $r->requester?->name,
            'requested_by_id' => $r->requested_by,
            'requested_at'  => LocalTime::format($r->requested_at, 'Y-m-d H:i'),
            'approved_by'   => $r->approver?->name,
            'approved_at'   => LocalTime::format($r->approved_at, 'Y-m-d H:i'),
            'approval_note' => $r->approval_note,
            'self_approved' => $r->self_approved,
            'rejected_by'   => $r->rejecter?->name,
            'rejected_at'   => LocalTime::format($r->rejected_at, 'Y-m-d H:i'),
            'reject_note'   => $r->reject_note,
        ];
    }
}
