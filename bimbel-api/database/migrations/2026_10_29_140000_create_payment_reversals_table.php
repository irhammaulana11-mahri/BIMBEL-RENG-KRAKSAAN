<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Reversal pembayaran (D-02): pembayaran CONFIRMED yang salah tidak dihapus atau diubah statusnya,
     * tetapi dibatalkan oleh catatan reversal yang mereferensikannya. Tagihan dihitung ulang dari
     * pembayaran yang tidak punya reversal APPROVED.
     *
     * Kolom akun (requested_by, approved_by, rejected_by) tanpa FK, mengikuti kolom akun lain di
     * schema finance (received_by, submitted_by, paid_by).
     */
    public function up(): void
    {
        Schema::create('finance.payment_reversals', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('payment_id');
            $table->decimal('amount', 15, 2);
            $table->text('reason');
            $table->string('status', 20)->default('PENDING');
            $table->uuid('requested_by')->nullable();
            $table->timestamp('requested_at');
            $table->uuid('approved_by')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->text('approval_note')->nullable();
            $table->boolean('self_approved')->default(false);
            $table->uuid('rejected_by')->nullable();
            $table->timestamp('rejected_at')->nullable();
            $table->text('reject_note')->nullable();
            $table->timestamps();

            $table->foreign('payment_id', 'fk_payment_reversals_payment')
                ->references('id')->on('finance.payments')->restrictOnDelete();
            $table->index('status', 'payment_reversals_status_index');
        });

        DB::statement("ALTER TABLE finance.payment_reversals ADD CONSTRAINT chk_payment_reversals_status CHECK (status IN ('PENDING','APPROVED','REJECTED'))");
        DB::statement('ALTER TABLE finance.payment_reversals ADD CONSTRAINT chk_payment_reversals_amount CHECK (amount > 0)');
        // Satu pembayaran: maksimal satu reversal yang masih diajukan atau sudah disetujui
        DB::statement("CREATE UNIQUE INDEX payment_reversals_active_unique ON finance.payment_reversals (payment_id) WHERE status IN ('PENDING','APPROVED')");
    }

    public function down(): void
    {
        Schema::dropIfExists('finance.payment_reversals');
    }
};
