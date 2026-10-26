<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('academic.session_activities', function (Blueprint $table) {

            /*
            |--------------------------------------------------------------------------
            | PRIMARY KEY
            |--------------------------------------------------------------------------
            */

            $table->uuid('id')->primary();


            /*
            |--------------------------------------------------------------------------
            | RELATION TO SCHEDULE SESSION
            |--------------------------------------------------------------------------
            |
            | Satu schedule_session dapat memiliki banyak activity.
            |
            */

            $table->uuid('schedule_session_id');


            /*
            |--------------------------------------------------------------------------
            | ACTIVITY TYPE
            |--------------------------------------------------------------------------
            |
            | MATERIAL
            | ASSESSMENT
            | REVIEW
            | DISCUSSION
            |
            | QUIZ / EXAM tidak dibuat sebagai activity_type tersendiri.
            | Keduanya berada di exam.exams.
            |
            */

            $table->string('activity_type', 20);


            /*
            |--------------------------------------------------------------------------
            | BASIC INFORMATION
            |--------------------------------------------------------------------------
            */

            $table->string('title', 150);

            $table->text('description')->nullable();


            /*
            |--------------------------------------------------------------------------
            | POLYMORPHIC REFERENCE
            |--------------------------------------------------------------------------
            |
            | Contoh:
            |
            | activityable_type = material
            | activityable_id   = UUID material
            |
            | atau:
            |
            | activityable_type = exam
            | activityable_id   = UUID exam
            |
            */

            $table->string('activityable_type', 100)->nullable();

            $table->uuid('activityable_id')->nullable();


            /*
            |--------------------------------------------------------------------------
            | ORDER
            |--------------------------------------------------------------------------
            |
            | Urutan aktivitas dalam satu sesi.
            |
            | Contoh:
            |
            | 1 = Materi
            | 2 = Discussion
            | 3 = Assessment
            | 4 = Review
            |
            */

            $table->unsignedSmallInteger('display_order')
                ->default(1);


            /*
            |--------------------------------------------------------------------------
            | STATUS
            |--------------------------------------------------------------------------
            |
            | DRAFT
            | READY
            | IN_PROGRESS
            | COMPLETED
            | CANCELLED
            |
            */

            $table->string('status', 20)
                ->default('DRAFT');


            /*
            |--------------------------------------------------------------------------
            | ACTIVITY TIME
            |--------------------------------------------------------------------------
            |
            | Tidak harus sama dengan schedule_session.
            |
            | Contoh:
            |
            | Session 07:00 - 09:00
            |
            | Material    07:00 - 07:45
            | Assessment  07:45 - 08:15
            | Review      08:15 - 09:00
            |
            */

            $table->time('start_time')->nullable();

            $table->time('end_time')->nullable();


            /*
            |--------------------------------------------------------------------------
            | EXECUTION TIMESTAMP
            |--------------------------------------------------------------------------
            */

            $table->timestamp('started_at')->nullable();

            $table->timestamp('completed_at')->nullable();


            /*
            |--------------------------------------------------------------------------
            | NOTE
            |--------------------------------------------------------------------------
            |
            | Catatan tentor/admin mengenai aktivitas.
            |
            */

            $table->text('note')->nullable();


            /*
            |--------------------------------------------------------------------------
            | AUDIT
            |--------------------------------------------------------------------------
            */

            $table->uuid('created_by')->nullable();

            $table->uuid('updated_by')->nullable();


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

            $table->foreign('schedule_session_id')
                ->references('id')
                ->on('academic.schedule_sessions')
                ->cascadeOnDelete();


            /*
            |--------------------------------------------------------------------------
            | INDEXES
            |--------------------------------------------------------------------------
            */

            $table->index(
                ['schedule_session_id', 'display_order'],
                'session_activities_session_order_idx'
            );

            $table->index(
                ['activity_type', 'status'],
                'session_activities_type_status_idx'
            );

            $table->index(
                ['activityable_type', 'activityable_id'],
                'session_activities_activityable_idx'
            );

            $table->index(
                'created_by',
                'session_activities_created_by_idx'
            );

            $table->index(
                'updated_by',
                'session_activities_updated_by_idx'
            );
        });


        /*
        |--------------------------------------------------------------------------
        | POSTGRESQL CHECK CONSTRAINTS
        |--------------------------------------------------------------------------
        |
        | Blueprint Laravel versi project Anda tidak menyediakan:
        |
        | $table->check()
        |
        | sehingga constraint dibuat menggunakan SQL PostgreSQL.
        |
        */

        DB::statement("
            ALTER TABLE academic.session_activities
            ADD CONSTRAINT session_activities_activity_type_check
            CHECK (
                activity_type IN (
                    'MATERIAL',
                    'ASSESSMENT',
                    'REVIEW',
                    'DISCUSSION'
                )
            )
        ");


        DB::statement("
            ALTER TABLE academic.session_activities
            ADD CONSTRAINT session_activities_status_check
            CHECK (
                status IN (
                    'DRAFT',
                    'READY',
                    'IN_PROGRESS',
                    'COMPLETED',
                    'CANCELLED'
                )
            )
        ");


        DB::statement("
            ALTER TABLE academic.session_activities
            ADD CONSTRAINT session_activities_time_check
            CHECK (
                start_time IS NULL
                OR end_time IS NULL
                OR end_time > start_time
            )
        ");


        /*
        |--------------------------------------------------------------------------
        | POLYMORPHIC CONSISTENCY
        |--------------------------------------------------------------------------
        |
        | Jika activityable_type diisi maka activityable_id juga harus diisi.
        | Begitu juga sebaliknya.
        |
        */

        DB::statement("
            ALTER TABLE academic.session_activities
            ADD CONSTRAINT session_activities_activityable_pair_check
            CHECK (
                (
                    activityable_type IS NULL
                    AND activityable_id IS NULL
                )
                OR
                (
                    activityable_type IS NOT NULL
                    AND activityable_id IS NOT NULL
                )
            )
        ");
    }


    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        /*
        |--------------------------------------------------------------------------
        | DROP TABLE
        |--------------------------------------------------------------------------
        |
        | Constraint otomatis ikut terhapus ketika table di-drop.
        |
        */

        Schema::dropIfExists(
            'academic.session_activities'
        );
    }
};