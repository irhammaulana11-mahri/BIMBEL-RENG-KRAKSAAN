<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Backup & pemulihan.
     *
     * backups         : riwayat berkas backup (manual, terjadwal, otomatis sebelum pemulihan, unggahan)
     * backup_settings : jadwal backup otomatis (satu baris)
     *
     * Keduanya di schema public dan tidak ikut di-dump, sehingga riwayat & jadwal tetap utuh
     * saat database dipulihkan ke kondisi lama.
     */
    public function up(): void
    {
        Schema::create('public.backups', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('filename', 200)->nullable();
            $table->string('type', 20);
            $table->string('status', 20)->default('RUNNING');
            $table->boolean('include_files')->default(true);
            $table->unsignedBigInteger('size_bytes')->nullable();
            $table->string('checksum', 64)->nullable();
            $table->json('manifest')->nullable();
            $table->text('note')->nullable();
            $table->text('error_message')->nullable();
            $table->uuid('created_by')->nullable();
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            // Pemulihan terakhir dari berkas ini
            $table->string('restore_status', 20)->nullable();
            $table->text('restore_error')->nullable();
            $table->uuid('restored_by')->nullable();
            $table->timestamp('restored_at')->nullable();
            $table->timestamps();

            $table->index(['type', 'status'], 'idx_backups_type_status');
        });

        DB::statement("
            ALTER TABLE public.backups
            ADD CONSTRAINT backups_type_check CHECK (type IN ('MANUAL', 'SCHEDULED', 'PRE_RESTORE', 'UPLOADED')),
            ADD CONSTRAINT backups_status_check CHECK (status IN ('RUNNING', 'SUCCESS', 'FAILED'))
        ");

        Schema::create('public.backup_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('enabled')->default(false);
            $table->string('frequency', 10)->default('DAILY');
            $table->string('run_time', 5)->default('02:00');
            $table->unsignedTinyInteger('day_of_week')->default(7);
            $table->unsignedTinyInteger('day_of_month')->default(1);
            $table->boolean('include_files')->default(true);
            $table->unsignedSmallInteger('retention_count')->default(14);
            $table->uuid('updated_by')->nullable();
            $table->timestamps();
        });

        DB::statement("
            ALTER TABLE public.backup_settings
            ADD CONSTRAINT backup_settings_frequency_check CHECK (frequency IN ('DAILY', 'WEEKLY', 'MONTHLY'))
        ");
    }

    public function down(): void
    {
        Schema::dropIfExists('public.backup_settings');
        Schema::dropIfExists('public.backups');
    }
};
