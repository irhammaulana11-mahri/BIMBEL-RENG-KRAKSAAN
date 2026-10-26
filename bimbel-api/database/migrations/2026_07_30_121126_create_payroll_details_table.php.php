<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create Finance Payroll Details Table
     */
    public function up(): void
    {
        Schema::create('finance.payroll_details', function (Blueprint $table) {

            /*
            |--------------------------------------------------------------------------
            | PRIMARY KEY
            |--------------------------------------------------------------------------
            */

            $table->uuid('id')->primary();

            /*
            |--------------------------------------------------------------------------
            | RELATIONSHIP
            |--------------------------------------------------------------------------
            */

            $table->uuid('payroll_id');

            $table->uuid('tentor_id');

            $table->uuid('tentor_attendance_id');

            $table->uuid('session_id');

            /*
            |--------------------------------------------------------------------------
            | PAYROLL SNAPSHOT
            |--------------------------------------------------------------------------
            */

            $table->unsignedInteger('teaching_minutes')
                  ->default(0);

            $table->decimal('rate_per_session',15,2)
                  ->default(0);

            $table->decimal('rate_per_hour',15,2)
                  ->default(0);

            $table->decimal('subtotal',15,2)
                  ->default(0);

            /*
            |--------------------------------------------------------------------------
            | INFORMATION
            |--------------------------------------------------------------------------
            */

            $table->text('note')->nullable();

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMP
            |--------------------------------------------------------------------------
            */

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | FOREIGN KEY
            |--------------------------------------------------------------------------
            */

            $table->foreign(
                'payroll_id',
                'fk_payroll_details_payroll'
            )
                ->references('id')
                ->on('finance.payrolls')
                ->cascadeOnDelete();

            $table->foreign(
                'tentor_id',
                'fk_payroll_details_tentor'
            )
                ->references('id')
                ->on('master.tentors')
                ->restrictOnDelete();

            $table->foreign(
                'tentor_attendance_id',
                'fk_payroll_details_attendance'
            )
                ->references('id')
                ->on('academic.tentor_attendances')
                ->restrictOnDelete();

            $table->foreign(
                'session_id',
                'fk_payroll_details_session'
            )
                ->references('id')
                ->on('academic.schedule_sessions')
                ->restrictOnDelete();

            /*
            |--------------------------------------------------------------------------
            | INDEX
            |--------------------------------------------------------------------------
            */

            $table->index(
                'payroll_id',
                'idx_payroll_details_payroll'
            );

            $table->index(
                'tentor_id',
                'idx_payroll_details_tentor'
            );

            $table->index(
                'tentor_attendance_id',
                'idx_payroll_details_attendance'
            );

            $table->index(
                'session_id',
                'idx_payroll_details_session'
            );

            /*
            |--------------------------------------------------------------------------
            | COMPOSITE INDEX
            |--------------------------------------------------------------------------
            */

            $table->index(
                [
                    'payroll_id',
                    'tentor_id'
                ],
                'idx_payroll_details_payroll_tentor'
            );

            /*
            |--------------------------------------------------------------------------
            | UNIQUE
            |--------------------------------------------------------------------------
            | Mencegah attendance yang sama dibayar dua kali
            |--------------------------------------------------------------------------
            */

            $table->unique(
                [
                    'payroll_id',
                    'tentor_attendance_id'
                ],
                'uq_payroll_details_attendance'
            );

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {

        Schema::table('finance.payroll_details', function (Blueprint $table) {

            $table->dropForeign(
                'fk_payroll_details_payroll'
            );

            $table->dropForeign(
                'fk_payroll_details_tentor'
            );

            $table->dropForeign(
                'fk_payroll_details_attendance'
            );

            $table->dropForeign(
                'fk_payroll_details_session'
            );

            $table->dropUnique(
                'uq_payroll_details_attendance'
            );

            $table->dropIndex(
                'idx_payroll_details_payroll'
            );

            $table->dropIndex(
                'idx_payroll_details_tentor'
            );

            $table->dropIndex(
                'idx_payroll_details_attendance'
            );

            $table->dropIndex(
                'idx_payroll_details_session'
            );

            $table->dropIndex(
                'idx_payroll_details_payroll_tentor'
            );

        });

        Schema::dropIfExists('finance.payroll_details');
    }
};