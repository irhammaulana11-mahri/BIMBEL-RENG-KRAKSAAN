<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create Finance Invoices Table
     */
    public function up(): void
    {
        Schema::create('finance.invoices', function (Blueprint $table) {

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
            $table->uuid('package_id');
            $table->uuid('class_id');

            /*
            |--------------------------------------------------------------------------
            | INVOICE INFORMATION
            |--------------------------------------------------------------------------
            */

            $table->string('invoice_no', 30);

            $table->date('issue_date');

            $table->date('due_date');

            /*
            |--------------------------------------------------------------------------
            | FINANCIAL SUMMARY
            |--------------------------------------------------------------------------
            */

            $table->decimal('subtotal', 15, 2)
                  ->default(0);

            $table->decimal('discount', 15, 2)
                  ->default(0);

            $table->decimal('total_amount', 15, 2)
                  ->default(0);

            $table->decimal('paid_amount', 15, 2)
                  ->default(0);

            $table->decimal('remaining_amount', 15, 2)
                  ->default(0);

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            $table->string('status', 20)
                  ->default('DRAFT');

            /*
            |--------------------------------------------------------------------------
            | NOTE
            |--------------------------------------------------------------------------
            */

            $table->text('note')
                  ->nullable();

            /*
            |--------------------------------------------------------------------------
            | TIMESTAMPS
            |--------------------------------------------------------------------------
            */

            $table->timestamps();

            /*
            |--------------------------------------------------------------------------
            | FOREIGN KEYS
            |--------------------------------------------------------------------------
            */

            $table->foreign(
                'student_id',
                'fk_invoices_student'
            )
                ->references('id')
                ->on('master.students')
                ->restrictOnDelete();

            $table->foreign(
                'package_id',
                'fk_invoices_package'
            )
                ->references('id')
                ->on('website.packages')
                ->restrictOnDelete();

            $table->foreign(
                'class_id',
                'fk_invoices_class'
            )
                ->references('id')
                ->on('academic.classes')
                ->restrictOnDelete();

            /*
            |--------------------------------------------------------------------------
            | UNIQUE
            |--------------------------------------------------------------------------
            */

            $table->unique(
                'invoice_no',
                'uq_invoices_number'
            );

            /*
            |--------------------------------------------------------------------------
            | INDEX
            |--------------------------------------------------------------------------
            */

            $table->index(
                'student_id',
                'idx_invoices_student'
            );

            $table->index(
                'package_id',
                'idx_invoices_package'
            );

            $table->index(
                'class_id',
                'idx_invoices_class'
            );

            $table->index(
                'status',
                'idx_invoices_status'
            );

            $table->index(
                'issue_date',
                'idx_invoices_issue_date'
            );

            $table->index(
                'due_date',
                'idx_invoices_due_date'
            );

            $table->index(
                [
                    'student_id',
                    'status'
                ],
                'idx_invoices_student_status'
            );

            $table->index(
                [
                    'issue_date',
                    'due_date'
                ],
                'idx_invoices_period'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('finance.invoices', function (Blueprint $table) {

            $table->dropForeign('fk_invoices_student');
            $table->dropForeign('fk_invoices_class');

            $table->dropUnique('uq_invoices_number');

            // Index di schema finance dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS finance.idx_invoices_student');
            // Index di schema finance dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS finance.idx_invoices_class');
            // Index di schema finance dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS finance.idx_invoices_status');
            // Index di schema finance dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS finance.idx_invoices_issue_date');
            // Index di schema finance dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS finance.idx_invoices_due_date');
            // Index di schema finance dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS finance.idx_invoices_student_status');
            // Index di schema finance dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS finance.idx_invoices_period');

        });

        Schema::dropIfExists('finance.invoices');
    }
};