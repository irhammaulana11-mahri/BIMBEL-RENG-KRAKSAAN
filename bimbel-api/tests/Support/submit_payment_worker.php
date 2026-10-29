<?php

/**
 * Proses pekerja untuk ConcurrentPaymentTest: mengajukan bukti bayar orang tua lewat PaymentService
 * dengan koneksi database sendiri, dimulai serentak pada waktu yang sama dengan pekerja lain.
 * Argumen: <user_id orang tua> <invoice_id> <waktu mulai, unix detik desimal>
 * Keluaran: OK | DITOLAK | ERROR <pesan>
 */

[, $userId, $invoiceId, $startAt] = $argv;

require __DIR__ . '/../../vendor/autoload.php';
$app = require __DIR__ . '/../../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Admin\User;
use App\Models\Finance\Invoice;
use App\Services\Finance\PaymentService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

if (DB::selectOne('select current_database() as name')->name !== 'bimbel_test') {
    fwrite(STDOUT, "ERROR bukan database uji\n");
    exit(1);
}

// Bukti bayar disimpan di folder uji, bukan di storage aplikasi
config(['filesystems.disks.' . PaymentService::PROOF_DISK . '.root' => storage_path('framework/testing/disks/concurrent')]);
auth()->setUser(User::findOrFail($userId));
$invoice = Invoice::findOrFail($invoiceId);
$proof = UploadedFile::fake()->create('bukti.pdf', 20, 'application/pdf');
$data = ['amount' => 100000, 'payment_date' => '2026-10-10', 'payment_channel' => 'BCA'];

while (microtime(true) < (float) $startAt) usleep(200);

try {
    app(PaymentService::class)->submitByParent($invoice, $data, $proof);
    echo "OK\n";
} catch (ValidationException) {
    echo "DITOLAK\n";
} catch (Throwable $e) {
    echo 'ERROR ' . class_basename($e) . ': ' . $e->getMessage() . "\n";
}
