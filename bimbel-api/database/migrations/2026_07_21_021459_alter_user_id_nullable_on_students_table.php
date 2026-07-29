<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Drop foreign key terlebih dahulu (jika ada)
        try {
            Schema::table('master.students', function (Blueprint $table) {
                $table->dropForeign(['user_id']);
            });
        } catch (\Throwable $e) {
            // Abaikan jika foreign key tidak ditemukan
        }

        // Ubah kolom menjadi nullable
        DB::statement("
            ALTER TABLE master.students
            ALTER COLUMN user_id DROP NOT NULL
        ");

        // Tambahkan kembali foreign key
        Schema::table('master.students', function (Blueprint $table) {
            $table->foreign('user_id')
                ->references('id')
                ->on('master.users')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        try {
            Schema::table('master.students', function (Blueprint $table) {
                $table->dropForeign(['user_id']);
            });
        } catch (\Throwable $e) {
        }

        DB::statement("
            UPDATE master.students
            SET user_id = (
                SELECT id
                FROM master.users
                LIMIT 1
            )
            WHERE user_id IS NULL
        ");

        DB::statement("
            ALTER TABLE master.students
            ALTER COLUMN user_id SET NOT NULL
        ");

        Schema::table('master.students', function (Blueprint $table) {
            $table->foreign('user_id')
                ->references('id')
                ->on('master.users');
        });
    }
};