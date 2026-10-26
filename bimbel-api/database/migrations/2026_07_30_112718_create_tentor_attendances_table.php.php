<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create Tentor Attendances Table
     */
    public function up(): void
    {
        Schema::create('academic.tentor_attendances', function (Blueprint $table) {

            /*
            |--------------------------------------------------------------------------
            | PRIMARY KEY
            |--------------------------------------------------------------------------
            */

            $table->uuid('id')->primary();

            /*
            |--------------------------------------------------------------------------
            | FOREIGN KEY
            |--------------------------------------------------------------------------
            */

            $table->uuid('session_id');

            $table->uuid('tentor_id');

            /*
            |--------------------------------------------------------------------------
            | ATTENDANCE
            |--------------------------------------------------------------------------
            */

            $table->string('attendance_status', 20)
                ->default('PRESENT');

            $table->timestamp('checked_in_at')->nullable();

            $table->timestamp('checked_out_at')->nullable();

            $table->unsignedInteger('late_minutes')
                ->default(0);

            /*
            |--------------------------------------------------------------------------
            | PAYROLL
            |--------------------------------------------------------------------------
            */

            $table->unsignedInteger('teaching_minutes')
                ->default(0);

            $table->boolean('is_payroll_processed')
                ->default(false);

            /*
            |--------------------------------------------------------------------------
            | NOTE
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
            | FOREIGN KEY CONSTRAINT
            |--------------------------------------------------------------------------
            */

            $table->foreign(
                'session_id',
                'fk_tentor_attendance_session'
            )
                ->references('id')
                ->on('academic.schedule_sessions')
                ->cascadeOnDelete();

            $table->foreign(
                'tentor_id',
                'fk_tentor_attendance_tentor'
            )
                ->references('id')
                ->on('master.tentors')
                ->restrictOnDelete();

            /*
            |--------------------------------------------------------------------------
            | INDEX
            |--------------------------------------------------------------------------
            */

            $table->index(
                'session_id',
                'idx_tentor_attendance_session'
            );

            $table->index(
                'tentor_id',
                'idx_tentor_attendance_tentor'
            );

            $table->index(
                'attendance_status',
                'idx_tentor_attendance_status'
            );

            $table->index(
                'checked_in_at',
                'idx_tentor_attendance_checkin'
            );

            $table->index(
                'is_payroll_processed',
                'idx_tentor_attendance_payroll'
            );

            $table->index(
                ['session_id', 'tentor_id'],
                'idx_tentor_attendance_session_tentor'
            );

            /*
            |--------------------------------------------------------------------------
            | UNIQUE
            |--------------------------------------------------------------------------
            | Satu tentor hanya boleh memiliki satu attendance
            | untuk setiap Schedule Session.
            |--------------------------------------------------------------------------
            */

            $table->unique(
                ['session_id', 'tentor_id'],
                'uq_tentor_attendance_session_tentor'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('academic.tentor_attendances', function (Blueprint $table) {

            $table->dropForeign('fk_tentor_attendance_session');

            $table->dropForeign('fk_tentor_attendance_tentor');

            $table->dropUnique('uq_tentor_attendance_session_tentor');

            $table->dropIndex('idx_tentor_attendance_session');

            $table->dropIndex('idx_tentor_attendance_tentor');

            $table->dropIndex('idx_tentor_attendance_status');

            $table->dropIndex('idx_tentor_attendance_checkin');

            $table->dropIndex('idx_tentor_attendance_payroll');

            $table->dropIndex('idx_tentor_attendance_session_tentor');

        });

        Schema::dropIfExists('academic.tentor_attendances');
    }
};