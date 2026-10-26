<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create Finance Payrolls Table
     */
    public function up(): void
    {
        Schema::create('finance.payrolls', function (Blueprint $table) {

            /*
            |--------------------------------------------------------------------------
            | PRIMARY KEY
            |--------------------------------------------------------------------------
            */

            $table->uuid('id')->primary();

            /*
            |--------------------------------------------------------------------------
            | PAYROLL INFORMATION
            |--------------------------------------------------------------------------
            */

            $table->string('payroll_no',30);

            $table->unsignedSmallInteger('period_month');

            $table->unsignedSmallInteger('period_year');

            $table->date('payroll_date');

            /*
            |--------------------------------------------------------------------------
            | SUMMARY
            |--------------------------------------------------------------------------
            */

            $table->unsignedInteger('total_tutors')
                  ->default(0);

            $table->unsignedInteger('total_sessions')
                  ->default(0);
            $table->unsignedInteger('total_teaching_minutes')
                    ->default(0);
            $table->decimal('total_amount',15,2)
                  ->default(0);

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            $table->string('status',20)
                  ->default('DRAFT');

            /*
            |--------------------------------------------------------------------------
            | INFORMATION
            |--------------------------------------------------------------------------
            */

            $table->text('note')
                  ->nullable();

            $table->timestamp('approved_at')
                  ->nullable();

            $table->timestamp('paid_at')
                  ->nullable();

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMP
            |--------------------------------------------------------------------------
            */

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | UNIQUE
            |--------------------------------------------------------------------------
            */

            $table->unique(
                'payroll_no',
                'uq_payrolls_number'
            );

            $table->unique(
                [
                    'period_month',
                    'period_year'
                ],
                'uq_payrolls_period'
            );

            /*
            |--------------------------------------------------------------------------
            | INDEX
            |--------------------------------------------------------------------------
            */

            $table->index(
                'status',
                'idx_payrolls_status'
            );

            $table->index(
                'payroll_date',
                'idx_payrolls_date'
            );

            $table->index(
                [
                    'period_year',
                    'period_month'
                ],
                'idx_payrolls_period'
            );

        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {

        Schema::table('finance.payrolls', function (Blueprint $table) {

            $table->dropUnique(
                'uq_payrolls_number'
            );

            $table->dropUnique(
                'uq_payrolls_period'
            );

            $table->dropIndex(
                'idx_payrolls_status'
            );

            $table->dropIndex(
                'idx_payrolls_date'
            );

            $table->dropIndex(
                'idx_payrolls_period'
            );

        });

        Schema::dropIfExists('finance.payrolls');
    }
};