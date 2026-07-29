<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void {
        // Schema::table('master.students', function (Blueprint $table) {

        //     $table->string('full_name',150)
        //         ->after('user_id');

        //     $table->string('education_level',30)
        //         ->nullable()
        //         ->after('birth_date');

        // });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void {
        // Schema::table('master.students', function (Blueprint $table) {

        //     $table->dropColumn([
        //         'full_name',
        //         'education_level'
        //     ]);

        // });
    }
};
