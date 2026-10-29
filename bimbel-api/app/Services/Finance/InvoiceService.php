<?php
namespace App\Services\Finance;

use App\Models\Academic\ClassRoom;
use App\Models\Academic\ScheduleSession;
use App\Models\Finance\Invoice;
use App\Models\Finance\InvoiceItem;
use App\Support\LocalTime;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Tagihan siswa per kelas per bulan. Nominal dihitung FeeRuleEngine dari absensi + aturan tarif
 * BILLING (fallback: harga paket bulanan), lalu dibekukan sebagai baris tagihan saat dibuat.
 * Status: UNPAID -> PARTIAL -> PAID, atau CANCELLED.
 */
class InvoiceService {

    public function __construct(protected FeeRuleEngine $engine, protected FinanceAudit $audit) {}

    /**
     * Hitung tagihan bulanan tanpa menyimpan (pratinjau untuk diperiksa Admin).
     */
    public function previewMonthly(int $year, int $month, ?array $classIds = null): array {
        $rows = $this->computeMonthly($year, $month, $classIds);

        return [
            'rows' => $rows->map(fn($r) => [
                'class_id'     => $r['class']->id,
                'class_name'   => $r['class']->name,
                'student_id'   => $r['student']->id,
                'student_name' => $r['student']->full_name,
                'already_billed' => $r['existing'],
                'items'        => collect($r['items'])->map(fn($i) => [
                    'item_name'   => $i['item_name'],
                    'description' => $i['description'],
                    'quantity'    => $i['quantity'],
                    'unit_price'  => $i['unit_price'],
                    'subtotal'    => round($i['quantity'] * $i['unit_price'], 2),
                    'calc_method' => $i['calc_method'],
                ])->values(),
                'total'        => round(collect($r['items'])->sum(fn($i) => $i['quantity'] * $i['unit_price']), 2),
                'warning'      => $r['warning'],
            ])->values(),
            'total_amount' => round($rows->where('existing', false)->sum(fn($r) => collect($r['items'])->sum(fn($i) => $i['quantity'] * $i['unit_price'])), 2),
        ];
    }

    /**
     * Buat tagihan bulanan untuk seluruh siswa kelas aktif terpilih.
     * Siswa yang sudah punya tagihan periode tersebut, atau tanpa baris tagihan, dilewati.
     */
    public function generateMonthly(int $year, int $month, string $dueDate, ?array $classIds = null): array {
        $rows = $this->computeMonthly($year, $month, $classIds);
        $created = 0;
        $skipped = 0;
        $empty = [];

        DB::transaction(function () use ($rows, $year, $month, $dueDate, &$created, &$skipped, &$empty) {
            foreach ($rows as $r) {
                if ($r['existing']) { $skipped++; continue; }
                if (empty($r['items'])) { $empty[] = "{$r['student']->full_name} ({$r['class']->name})"; continue; }

                $this->createInvoice([
                    'student_id'   => $r['student']->id,
                    'class_id'     => $r['class']->id,
                    'package_id'   => $r['class']->package_id,
                    'period_year'  => $year,
                    'period_month' => $month,
                    'due_date'     => $dueDate,
                    'items'        => $r['items'],
                ]);
                $created++;
            }
        });

        return ['created' => $created, 'skipped' => $skipped, 'without_items' => $empty];
    }

    private function computeMonthly(int $year, int $month, ?array $classIds) {
        $start = Carbon::create($year, $month, 1);
        $classes = ClassRoom::with(['package', 'students'])
            ->where('is_active', true)
            ->when($classIds, fn($q) => $q->whereIn('id', $classIds))
            ->orderBy('name')
            ->get();

        $sessions = ScheduleSession::with('studentAttendances')
            ->whereHas('schedule', fn($q) => $q->whereIn('class_id', $classes->pluck('id')))
            ->with('schedule:id,class_id')
            ->where('status', 'COMPLETED')
            ->whereBetween('session_date', [$start->toDateString(), $start->copy()->endOfMonth()->toDateString()])
            ->orderBy('session_date')->orderBy('start_time')
            ->get()
            ->groupBy(fn($s) => $s->schedule->class_id);

        $existing = Invoice::whereIn('class_id', $classes->pluck('id'))
            ->where('period_year', $year)->where('period_month', $month)
            ->where('status', '!=', 'CANCELLED')
            ->get(['class_id', 'student_id'])
            ->map(fn($i) => "{$i->class_id}|{$i->student_id}")
            ->flip();

        $rows = collect();
        foreach ($classes as $class) {
            foreach ($class->students as $student) {
                $result = $this->engine->billingItems($class, $student->id, $sessions->get($class->id, collect()), $year, $month);
                $rows->push([
                    'class'    => $class,
                    'student'  => $student,
                    'items'    => $result['items'],
                    'warning'  => $result['warning'],
                    'existing' => $existing->has("{$class->id}|{$student->id}"),
                ]);
            }
        }

        return $rows;
    }

    /**
     * Tagihan manual (mis. biaya pendaftaran / modul). Kelas menentukan paket.
     */
    public function createManual(array $data): Invoice {
        $class = ClassRoom::with('students')->findOrFail($data['class_id']);

        if (!$class->students->contains('id', $data['student_id'])) {
            throw ValidationException::withMessages(['student_id' => ['Siswa bukan peserta kelas tersebut.']]);
        }

        return DB::transaction(fn() => $this->createInvoice(array_merge($data, ['package_id' => $class->package_id])));
    }

    public function cancel(Invoice $invoice, string $reason): Invoice {
        if ($invoice->status === 'CANCELLED') {
            throw ValidationException::withMessages(['status' => ['Tagihan sudah dibatalkan.']]);
        }
        if ((float) $invoice->paid_amount > 0) {
            throw ValidationException::withMessages(['status' => ['Tagihan yang sudah dibayar sebagian/lunas tidak dapat dibatalkan.']]);
        }
        if ($invoice->paymentDetails()->whereHas('payment', fn($q) => $q->where('status', 'PENDING'))->exists()) {
            throw ValidationException::withMessages(['status' => ['Masih ada pembayaran yang menunggu verifikasi untuk tagihan ini.']]);
        }

        return DB::transaction(function () use ($invoice, $reason) {
            $before = $this->audit->snapshot($invoice);
            $invoice->update(['status' => 'CANCELLED', 'cancel_reason' => $reason]);
            $this->audit->record($invoice, 'CANCELLED', $before, $reason);

            return $invoice->refresh();
        });
    }

    /**
     * Hitung ulang total terbayar dari pembayaran CONFIRMED dan perbarui status.
     */
    public function recalculate(Invoice $invoice): Invoice {
        if ($invoice->status === 'CANCELLED') return $invoice;

        $paid = (float) $invoice->paymentDetails()
            ->whereHas('payment', fn($q) => $q->where('status', 'CONFIRMED'))
            ->sum('amount_paid');

        $total = (float) $invoice->total_amount;
        $remaining = max(0, round($total - $paid, 2));

        $invoice->update([
            'paid_amount'      => $paid,
            'remaining_amount' => $remaining,
            'status'           => $remaining <= 0 ? 'PAID' : ($paid > 0 ? 'PARTIAL' : 'UNPAID'),
        ]);

        return $invoice->refresh();
    }

    public function periodLabel(int $year, int $month): string {
        return Carbon::create($year, $month, 1)->locale('id')->translatedFormat('F Y');
    }

    private function createInvoice(array $data): Invoice {
        $issueDate = Carbon::parse($data['issue_date'] ?? LocalTime::today());
        if (Carbon::parse($data['due_date'])->lessThan($issueDate->copy()->startOfDay())) {
            throw ValidationException::withMessages(['due_date' => ['Jatuh tempo tidak boleh sebelum tanggal tagihan.']]);
        }
        $prefix = 'INV-' . $issueDate->format('Ym') . '-';

        $items = collect($data['items'])->values()->map(function ($item, $index) {
            $quantity = round((float) ($item['quantity'] ?? 1), 2);
            $unitPrice = (float) $item['unit_price'];
            $discount = (float) ($item['discount'] ?? 0);

            return [
                'item_type'   => $item['item_type'] ?? 'OTHER',
                'item_name'   => $item['item_name'],
                'description' => $item['description'] ?? null,
                'quantity'    => $quantity,
                'unit_price'  => $unitPrice,
                'discount'    => $discount,
                'subtotal'    => max(0, round($quantity * $unitPrice - $discount, 2)),
                'package_id'  => $item['package_id'] ?? null,
                'fee_rule_id' => $item['fee_rule_id'] ?? null,
                'calc_method' => $item['calc_method'] ?? null,
                'sort_order'  => $index + 1,
            ];
        });

        $subtotal = $items->sum('subtotal');
        $discount = (float) ($data['discount'] ?? 0);
        if ($discount > $subtotal) {
            throw ValidationException::withMessages(['discount' => ['Diskon melebihi total tagihan.']]);
        }
        $total = round($subtotal - $discount, 2);

        $invoice = Invoice::create([
            'student_id'       => $data['student_id'],
            'class_id'         => $data['class_id'],
            'package_id'       => $data['package_id'],
            'invoice_no'       => DocumentNumber::next('finance.invoices', 'invoice_no', $prefix),
            'issue_date'       => $issueDate->toDateString(),
            'due_date'         => $data['due_date'],
            'period_month'     => $data['period_month'] ?? null,
            'period_year'      => $data['period_year'] ?? null,
            'subtotal'         => $subtotal,
            'discount'         => $discount,
            'total_amount'     => $total,
            'paid_amount'      => 0,
            'remaining_amount' => $total,
            'status'           => $total > 0 ? 'UNPAID' : 'PAID',
            'note'             => $data['note'] ?? null,
            'created_by'       => Auth::id(),
        ]);

        foreach ($items as $item) {
            InvoiceItem::create(array_merge($item, ['invoice_id' => $invoice->id]));
        }

        $this->audit->record($invoice, 'CREATED', meta: [
            'source' => isset($data['period_month']) ? 'monthly' : 'manual',
            'items'  => $items->map(fn($i) => ['name' => $i['item_name'], 'quantity' => $i['quantity'], 'unit_price' => $i['unit_price'], 'subtotal' => $i['subtotal']])->all(),
        ]);

        return $invoice;
    }
}
