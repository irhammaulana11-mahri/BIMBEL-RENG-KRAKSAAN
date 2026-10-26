<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create Finance Invoice Items Table
     */
    public function up(): void
    {
        Schema::create('finance.invoice_items', function (Blueprint $table) {

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

            $table->uuid('invoice_id');

            $table->uuid('package_id')
                  ->nullable();

            $table->uuid('curriculum_id')
                  ->nullable();

            /*
            |--------------------------------------------------------------------------
            | ITEM INFORMATION
            |--------------------------------------------------------------------------
            */
            $table->string('reference_no',30)->nullable();
            $table->string('item_type',30);

            $table->string('item_name',200);

            $table->text('description')
                  ->nullable();

            /*
            |--------------------------------------------------------------------------
            | PRICE SNAPSHOT
            |--------------------------------------------------------------------------
            */

            $table->unsignedInteger('quantity')
                  ->default(1);

            $table->decimal('unit_price',15,2)
                  ->default(0);

            $table->decimal('discount',15,2)
                  ->default(0);

            $table->decimal('subtotal',15,2)
                  ->default(0);

            /*
            |--------------------------------------------------------------------------
            | ORDER
            |--------------------------------------------------------------------------
            */

            $table->unsignedInteger('sort_order')
                  ->default(1);

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
                'invoice_id',
                'fk_invoice_items_invoice'
            )
                ->references('id')
                ->on('finance.invoices')
                ->cascadeOnDelete();

            $table->foreign(
                'package_id',
                'fk_invoice_items_package'
            )
                ->references('id')
                ->on('website.packages')
                ->nullOnDelete();

            $table->foreign(
                'curriculum_id',
                'fk_invoice_items_curriculum'
            )
                ->references('id')
                ->on('academic.curriculums')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | INDEX
            |--------------------------------------------------------------------------
            */

            $table->index(
                'invoice_id',
                'idx_invoice_items_invoice'
            );

            $table->index(
                'package_id',
                'idx_invoice_items_package'
            );

            $table->index(
                'curriculum_id',
                'idx_invoice_items_curriculum'
            );

            $table->index(
                'item_type',
                'idx_invoice_items_type'
            );

            $table->index(
                'sort_order',
                'idx_invoice_items_sort'
            );

            $table->index(
                [
                    'invoice_id',
                    'sort_order'
                ],
                'idx_invoice_items_invoice_sort'
            );

            /*
            |--------------------------------------------------------------------------
            | UNIQUE
            |--------------------------------------------------------------------------
            */

            $table->unique(
                [
                    'invoice_id',
                    'sort_order'
                ],
                'uq_invoice_items_invoice_sort'
            );

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {

        Schema::table('finance.invoice_items', function (Blueprint $table) {

            $table->dropForeign(
                'fk_invoice_items_invoice'
            );

            $table->dropForeign(
                'fk_invoice_items_package'
            );

            $table->dropForeign(
                'fk_invoice_items_curriculum'
            );

            $table->dropUnique(
                'uq_invoice_items_invoice_sort'
            );

            $table->dropIndex(
                'idx_invoice_items_invoice'
            );

            $table->dropIndex(
                'idx_invoice_items_package'
            );

            $table->dropIndex(
                'idx_invoice_items_curriculum'
            );

            $table->dropIndex(
                'idx_invoice_items_type'
            );

            $table->dropIndex(
                'idx_invoice_items_sort'
            );

            $table->dropIndex(
                'idx_invoice_items_invoice_sort'
            );

        });

        Schema::dropIfExists('finance.invoice_items');
    }
};