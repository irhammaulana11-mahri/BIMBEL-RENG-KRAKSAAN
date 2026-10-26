<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Create Schedule Sessions Table
     */
    public function up(): void
    {
        Schema::create('academic.schedule_sessions', function (Blueprint $table) {

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

            $table->uuid('schedule_id');

            $table->uuid('subject_id');

            $table->uuid('tentor_id');

            $table->uuid('location_id')->nullable();

            /*
            |--------------------------------------------------------------------------
            | SESSION
            |--------------------------------------------------------------------------
            */

            $table->unsignedInteger('meeting_no');

            $table->date('session_date');

            $table->unsignedTinyInteger('day_of_week');

            $table->time('start_time');

            $table->time('end_time');

            /*
            |--------------------------------------------------------------------------
            | LOCATION
            |--------------------------------------------------------------------------
            */

            $table->string('room_name',100)->nullable();

            $table->text('meeting_url')->nullable();

            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            */

            $table->string('status',20)
                ->default('SCHEDULED');

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
                'schedule_id',
                'fk_schedule_sessions_schedule'
            )
                ->references('id')
                ->on('academic.schedules')
                ->cascadeOnDelete();

            $table->foreign(
                'subject_id',
                'fk_schedule_sessions_subject'
            )
                ->references('id')
                ->on('master.subjects')
                ->restrictOnDelete();

            $table->foreign(
                'tentor_id',
                'fk_schedule_sessions_tentor'
            )
                ->references('id')
                ->on('master.tentors')
                ->restrictOnDelete();

            $table->foreign(
                'location_id',
                'fk_schedule_sessions_location'
            )
                ->references('id')
                ->on('academic.learning_locations')
                ->nullOnDelete();

            /*
            |--------------------------------------------------------------------------
            | INDEX
            |--------------------------------------------------------------------------
            */

            $table->index(
                'schedule_id',
                'idx_schedule_sessions_schedule'
            );

            $table->index(
                'session_date',
                'idx_schedule_sessions_date'
            );

            $table->index(
                'status',
                'idx_schedule_sessions_status'
            );

            $table->index(
                'tentor_id',
                'idx_schedule_sessions_tentor'
            );

            $table->index(
                'subject_id',
                'idx_schedule_sessions_subject'
            );

            $table->index(
                'location_id',
                'idx_schedule_sessions_location'
            );

            $table->index(
                ['session_date','tentor_id'],
                'idx_schedule_sessions_date_tentor'
            );

            $table->unique(
                ['schedule_id','meeting_no'],
                'uq_schedule_sessions_meeting'
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academic.schedule_sessions');
    }
};