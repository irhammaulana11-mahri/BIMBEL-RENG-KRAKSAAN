<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic.class_subjects', function (Blueprint $table) {

            $table->uuid('id')->primary();

            $table->uuid('class_id');

            $table->uuid('package_subject_id')->nullable();

            $table->uuid('subject_id');

            $table->uuid('tentor_id')->nullable();

            $table->unsignedSmallInteger('meeting_target')->default(0);

            $table->unsignedSmallInteger('display_order')->default(1);

            $table->string('status',20)->default('ACTIVE');

            $table->timestamps();

            $table->foreign('class_id')
                ->references('id')
                ->on('academic.classes')
                ->cascadeOnDelete();

            $table->foreign('subject_id')
                ->references('id')
                ->on('master.subjects')
                ->restrictOnDelete();

            $table->foreign('tentor_id')
                ->references('id')
                ->on('master.tentors')
                ->nullOnDelete();

            // aktifkan jika package_subjects sudah dibuat
            // $table->foreign('package_subject_id')
            //     ->references('id')
            //     ->on('website.package_subjects')
            //     ->nullOnDelete();

            $table->unique([
                'class_id',
                'subject_id'
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academic.class_subjects');
    }
};