<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Jenis aktivitas mengikuti desain Session Workspace:
     * MATERIAL, EXAM, DISCUSSION, REVIEW.
     * Exam dihubungkan ke exam.exams lewat activityable (tanpa tabel quiz terpisah).
     */
    public function up(): void
    {
        DB::statement("UPDATE academic.session_activities SET activity_type = 'EXAM' WHERE activity_type = 'ASSESSMENT'");

        DB::statement("ALTER TABLE academic.session_activities DROP CONSTRAINT IF EXISTS session_activities_activity_type_check");

        DB::statement("
            ALTER TABLE academic.session_activities
            ADD CONSTRAINT session_activities_activity_type_check
            CHECK (
                activity_type IN (
                    'MATERIAL',
                    'EXAM',
                    'REVIEW',
                    'DISCUSSION'
                )
            )
        ");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("UPDATE academic.session_activities SET activity_type = 'ASSESSMENT' WHERE activity_type = 'EXAM'");

        DB::statement("ALTER TABLE academic.session_activities DROP CONSTRAINT IF EXISTS session_activities_activity_type_check");

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
    }
};
