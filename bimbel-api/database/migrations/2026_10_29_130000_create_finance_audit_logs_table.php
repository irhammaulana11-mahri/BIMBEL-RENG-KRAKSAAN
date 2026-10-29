<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Jejak audit keuangan (append-only): siapa melakukan apa pada tagihan, pembayaran, dan payroll,
     * beserta kondisi sebelum/sesudah. Ditulis di transaksi yang sama dengan perubahannya.
     *
     * actor_id sengaja tanpa FK agar akun yang dihapus tidak menghapus/menghalangi jejaknya;
     * actor_name menyimpan nama saat aksi terjadi.
     */
    public function up(): void
    {
        DB::statement('CREATE SCHEMA IF NOT EXISTS logs');

        Schema::create('logs.finance_audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('entity_type', 50);
            $table->uuid('entity_id');
            $table->string('action', 50);
            $table->uuid('actor_id')->nullable();
            $table->string('actor_name', 150)->nullable();
            $table->jsonb('before')->nullable();
            $table->jsonb('after')->nullable();
            $table->text('reason')->nullable();
            $table->jsonb('meta')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->index(['entity_type', 'entity_id'], 'finance_audit_logs_entity_index');
            $table->index('actor_id', 'finance_audit_logs_actor_index');
            $table->index('created_at', 'finance_audit_logs_created_index');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('logs.finance_audit_logs');
    }
};
