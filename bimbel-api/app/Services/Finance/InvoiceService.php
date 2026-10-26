<?php
namespace App\Services\Finance;

use App\Models\Academic\ClassRoom;
use App\Models\Finance\Invoice;
use App\Models\Finance\InvoiceItem;
use App\Support\LocalTime;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Tagihan siswa. Tagihan bulanan = harga paket kelas (snapshot saat dibuat).
 * Status: UNPAID -> PARTIAL -> PAID, atau CANCELLED.
 */
class InvoiceService {

    /**
     * Buat tagihan bulanan untuk seluruh siswa di kelas aktif yang memiliki paket.
     * Siswa yang sudah punya tagihan periode tersebut dilewati.
     */
    public function generateMonthly(int $year, int $month, string $dueDate, ?array $classIds = null): array {
        $classes = ClassRoom::with(['package', 'students'])
            ->where('is_active', true)
            ->when($classIds, fn($q) => $q->whereIn('id', $classIds))
            ->get();

        $created = 0;
        $skipped = 0;
        $withoutPackage = [];

        DB::transaction(function () use ($classes, $year, $month, $dueDate, &$created, &$skipped, &$withoutPackage) {
            foreach ($classes as $class) {
                if (!$class->package) {
                    $withoutPackage[] = $class->name;
                    continue;
                }

                $existing = Invoice::where('class_id', $class->id)
                    ->where('period_year', $year)
                    ->where('period_month', $month)
                    ->where('status', '!=', 'CANCELLED')
                    ->pluck('student_id')
                    ->all();

                foreach ($class->students as $student) {
                    if (in_array($student->id, $existing)) {
                        $skipped++;
                        continue;
                    }

                    $price = (float) $class->package->default_price;
                    $this->createInvoice([
                        'student_id'   => $student->id,
                        'class_id'     => $class->id,
                        'package_id'   => $class->package_id,
                        'period_year'  => $year,
                        'period_month' => $month,
                        'due_date'     => $dueDate,
                        'items'        => [[
                            'item_type'  => 'PACKAGE',
                            'item_name'  => $class->package->package_name . ' - ' . $this->periodLabel($year, $month),
                            'description'=> 'Kelas ' . $class->name,
                            'quantity'   => 1,
                            'unit_price' => $price,
                            'package_id' => $class->package_id,
                        ]],
                    ]);
                    $created++;
                }
            }
        });

        return [
            'created'         => $created,
            'skipped'         => $skipped,
            'without_package' => $withoutPackage,
        ];
    }

    /**
     * Tagihan manual (mis. biaya pendaftaran / modul). Kelas menentukan paket.
     */
    public function createManual(array $data): Invoice {
        $class = ClassRoom::with('students')->findOrFail($data['class_id']);

        if (!$class->package_id) {
            throw ValidationException::withMessages(['class_id' => ['Kelas belum memiliki paket.']]);
        }
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

        $invoice->update(['status' => 'CANCELLED', 'cancel_reason' => $reason]);

        return $invoice->refresh();
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
            $quantity = (int) ($item['quantity'] ?? 1);
            $unitPrice = (float) $item['unit_price'];
            $discount = (float) ($item['discount'] ?? 0);

            return [
                'item_type'   => $item['item_type'] ?? 'OTHER',
                'item_name'   => $item['item_name'],
                'description' => $item['description'] ?? null,
                'quantity'    => $quantity,
                'unit_price'  => $unitPrice,
                'discount'    => $discount,
                'subtotal'    => max(0, $quantity * $unitPrice - $discount),
                'package_id'  => $item['package_id'] ?? null,
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

        return $invoice;
    }
}
