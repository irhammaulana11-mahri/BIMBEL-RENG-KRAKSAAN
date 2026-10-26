<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create Finance Payment Details Table
     */
    public function up(): void
    {
        Schema::create('finance.payment_details', function (Blueprint $table) {

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

            $table->uuid('payment_id');

            $table->uuid('invoice_id');

            /*
            |--------------------------------------------------------------------------
            | PAYMENT ALLOCATION
            |--------------------------------------------------------------------------
            */

            $table->decimal('amount_paid', 15, 2)
                  ->default(0);

            /*
            |--------------------------------------------------------------------------
            | INFORMATION
            |--------------------------------------------------------------------------
            */

            $table->text('note')
                  ->nullable();

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */
            $table->timestamp('allocated_at')
                    ->nullable();
                    
            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | FOREIGN KEY
            |--------------------------------------------------------------------------
            */

            $table->foreign(
                'payment_id',
                'fk_payment_details_payment'
            )
                ->references('id')
                ->on('finance.payments')
                ->cascadeOnDelete();

            $table->foreign(
                'invoice_id',
                'fk_payment_details_invoice'
            )
                ->references('id')
                ->on('finance.invoices')
                ->restrictOnDelete();

            /*
            |--------------------------------------------------------------------------
            | UNIQUE
            |--------------------------------------------------------------------------
            */

            $table->unique(
                [
                    'payment_id',
                    'invoice_id'
                ],
                'uq_payment_details_payment_invoice'
            );

            /*
            |--------------------------------------------------------------------------
            | INDEX
            |--------------------------------------------------------------------------
            */

            $table->index(
                'payment_id',
                'idx_payment_details_payment'
            );

            $table->index(
                'invoice_id',
                'idx_payment_details_invoice'
            );

            $table->index(
                [
                    'payment_id',
                    'invoice_id'
                ],
                'idx_payment_details_payment_invoice'
            );

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {

        Schema::table('finance.payment_details', function (Blueprint $table) {

            $table->dropForeign(
                'fk_payment_details_payment'
            );

            $table->dropForeign(
                'fk_payment_details_invoice'
            );

            $table->dropUnique(
                'uq_payment_details_payment_invoice'
            );

            $table->dropIndex(
                'idx_payment_details_payment'
            );

            $table->dropIndex(
                'idx_payment_details_invoice'
            );

            $table->dropIndex(
                'idx_payment_details_payment_invoice'
            );

        });

        Schema::dropIfExists('finance.payment_details');
    }
};