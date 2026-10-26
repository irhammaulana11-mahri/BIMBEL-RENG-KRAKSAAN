<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create Finance Payments Table
     */
    public function up(): void
    {
        Schema::create('finance.payments', function (Blueprint $table) {

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

            $table->uuid('student_id');

            /*
            |--------------------------------------------------------------------------
            | PAYMENT INFORMATION
            |--------------------------------------------------------------------------
            */

            $table->string('payment_no',30);

            $table->date('payment_date');

            $table->string('payment_method',30);

            $table->string('payment_channel',50)
                  ->nullable();

            $table->string('reference_no',100)
                  ->nullable();

            /*
            |--------------------------------------------------------------------------
            | FINANCIAL
            |--------------------------------------------------------------------------
            */

            $table->decimal('total_amount',15,2)
                  ->default(0);

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            $table->string('status',20)
                  ->default('PENDING');

            $table->uuid('received_by')->nullable();

            /*
            |--------------------------------------------------------------------------
            | INFORMATION
            |--------------------------------------------------------------------------
            */

            $table->text('note')
                  ->nullable();
            
            $table->text('payment_proof')
                    ->nullable();

            $table->timestamp('confirmed_at')
                  ->nullable();

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | FOREIGN KEY
            |--------------------------------------------------------------------------
            */

            $table->foreign(
                'student_id',
                'fk_payments_student'
            )
                ->references('id')
                ->on('master.students')
                ->restrictOnDelete();

            $table->foreign(
                'received_by',
                'fk_payments_received_by'
            )
                ->references('id')
                ->on('master.users')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | UNIQUE
            |--------------------------------------------------------------------------
            */

            $table->unique(
                'payment_no',
                'uq_payments_number'
            );

            /*
            |--------------------------------------------------------------------------
            | INDEX
            |--------------------------------------------------------------------------
            */

            $table->index(
                'student_id',
                'idx_payments_student'
            );

            $table->index(
                'payment_date',
                'idx_payments_date'
            );

            $table->index(
                'payment_method',
                'idx_payments_method'
            );

            $table->index(
                'status',
                'idx_payments_status'
            );

            $table->index(
                'reference_no',
                'idx_payments_reference'
            );

            $table->index(
                [
                    'student_id',
                    'status'
                ],
                'idx_payments_student_status'
            );


        });

    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {

        Schema::table('finance.payments', function (Blueprint $table) {

            $table->dropForeign(
                'fk_payments_student'
            );

            $table->dropUnique(
                'uq_payments_number'
            );

            $table->dropIndex(
                'idx_payments_student'
            );

            $table->dropIndex(
                'idx_payments_date'
            );

            $table->dropIndex(
                'idx_payments_method'
            );

            $table->dropIndex(
                'idx_payments_status'
            );

            $table->dropIndex(
                'idx_payments_reference'
            );

            $table->dropIndex(
                'idx_payments_student_status'
            );

        });

        Schema::dropIfExists('finance.payments');
    }
};