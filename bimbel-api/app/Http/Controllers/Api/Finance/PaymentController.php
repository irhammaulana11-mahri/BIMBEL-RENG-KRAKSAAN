<?php

namespace App\Http\Controllers\Api\Finance;

use App\Http\Controllers\Controller;
use App\Http\Requests\Finance\PaymentRequest;
use App\Http\Resources\Finance\PaymentResource;
use App\Models\Finance\Payment;
use App\Services\Finance\PaymentService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Pembayaran siswa (Admin): verifikasi bukti transfer & pencatatan langsung.
 */
class PaymentController extends Controller
{
    private const RELATIONS = ['student', 'details.invoice', 'submitter', 'receiver'];

    public function __construct(protected PaymentService $paymentService) {}

    public function index(Request $request)
    {
        $query = Payment::query()->with(self::RELATIONS);

        if ($request->filled('status')) {
            $query->where('status', strtoupper($request->status));
        }

        if ($request->filled('period')) {
            $query->whereYear('payment_date', (int) substr($request->period, 0, 4))
                  ->whereMonth('payment_date', (int) substr($request->period, 5, 2));
        }

        if ($request->filled('keyword')) {
            $kw = '%' . trim($request->keyword) . '%';
            $query->where(fn($q) => $q
                ->where('payment_no', 'ILIKE', $kw)
                ->orWhere('reference_no', 'ILIKE', $kw)
                ->orWhereHas('student', fn($sq) => $sq->where('full_name', 'ILIKE', $kw)));
        }

        $perPage = min(max($request->integer('per_page', 15), 1), 100);
        $payments = $query->orderByRaw("CASE WHEN status = 'PENDING' THEN 0 ELSE 1 END")
            ->orderByDesc('created_at')
            ->paginate($perPage)
            ->withQueryString();

        return PaymentResource::collection($payments)->additional([
            'summary' => ['pending' => Payment::where('status', 'PENDING')->count()],
        ]);
    }

    public function show(Payment $payment)
    {
        return new PaymentResource($payment->load(self::RELATIONS));
    }

    // POST: Admin mencatat pembayaran (langsung terkonfirmasi)
    public function store(PaymentRequest $request)
    {
        $payment = $this->paymentService->recordByAdmin($request->validated());

        return (new PaymentResource($payment->load(self::RELATIONS)))->additional(['message' => 'Pembayaran berhasil dicatat.']);
    }

    public function approve(Payment $payment)
    {
        $payment = $this->paymentService->approve($payment);

        return (new PaymentResource($payment->load(self::RELATIONS)))->additional(['message' => 'Pembayaran diterima.']);
    }

    public function reject(Request $request, Payment $payment)
    {
        $data = $request->validate(['reason' => ['required', 'string', 'max:500']]);
        $payment = $this->paymentService->reject($payment, $data['reason']);

        return (new PaymentResource($payment->load(self::RELATIONS)))->additional(['message' => 'Pembayaran ditolak.']);
    }

    // GET: Bukti transfer (disk privat)
    public function proof(Payment $payment)
    {
        return self::streamProof($payment);
    }

    public static function streamProof(Payment $payment)
    {
        $disk = Storage::disk(PaymentService::PROOF_DISK);
        abort_unless($payment->payment_proof && $disk->exists($payment->payment_proof), 404, 'Bukti pembayaran tidak ditemukan.');

        return $disk->response($payment->payment_proof, null, ['Cache-Control' => 'private, max-age=0']);
    }
}
