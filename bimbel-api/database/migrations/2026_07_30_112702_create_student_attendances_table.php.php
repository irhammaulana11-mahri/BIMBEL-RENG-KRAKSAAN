<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create Student Attendances Table
     */
    public function up(): void
    {
        Schema::create('academic.student_attendances', function (Blueprint $table) {

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

            $table->uuid('student_id');

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
                'fk_student_attendance_session'
            )
                ->references('id')
                ->on('academic.schedule_sessions')
                ->cascadeOnDelete();

            $table->foreign(
                'student_id',
                'fk_student_attendance_student'
            )
                ->references('id')
                ->on('master.students')
                ->restrictOnDelete();

            /*
            |--------------------------------------------------------------------------
            | INDEX
            |--------------------------------------------------------------------------
            */

            $table->index(
                'session_id',
                'idx_student_attendance_session'
            );

            $table->index(
                'student_id',
                'idx_student_attendance_student'
            );

            $table->index(
                'attendance_status',
                'idx_student_attendance_status'
            );

            $table->index(
                'checked_in_at',
                'idx_student_attendance_checkin'
            );

            $table->index(
                ['session_id', 'student_id'],
                'idx_student_attendance_session_student'
            );

            /*
            |--------------------------------------------------------------------------
            | UNIQUE
            |--------------------------------------------------------------------------
            | Satu siswa hanya boleh memiliki satu record attendance
            | untuk setiap Schedule Session.
            |--------------------------------------------------------------------------
            */

            $table->unique(
                ['session_id', 'student_id'],
                'uq_student_attendance_session_student'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('academic.student_attendances', function (Blueprint $table) {

            $table->dropForeign('fk_student_attendance_session');

            $table->dropForeign('fk_student_attendance_student');

            $table->dropUnique('uq_student_attendance_session_student');

            // Index di schema academic dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS academic.idx_student_attendance_session');

            // Index di schema academic dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS academic.idx_student_attendance_student');

            // Index di schema academic dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS academic.idx_student_attendance_status');

            // Index di schema academic dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS academic.idx_student_attendance_checkin');

            // Index di schema academic dihapus dengan nama lengkap (dropIndex tidak menyertakan schema)
            DB::statement('DROP INDEX IF EXISTS academic.idx_student_attendance_session_student');

        });

        Schema::dropIfExists('academic.student_attendances');
    }
};