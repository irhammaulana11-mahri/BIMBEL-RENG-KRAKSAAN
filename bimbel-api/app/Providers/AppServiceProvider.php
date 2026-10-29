<?php

namespace App\Providers;

use App\Models\Admin\User;
use App\Models\Academic\Curriculum;
use App\Models\Academic\Material;
use App\Models\Exam\Exam;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Alias activityable_type pada academic.session_activities
        Relation::morphMap([
            'material'   => Material::class,
            'exam'       => Exam::class,
            'curriculum' => Curriculum::class,
        ]);

        // Token dari akun/profil yang sudah dinonaktifkan langsung ditolak (401) di setiap permintaan
        Sanctum::authenticateAccessTokensUsing(
            fn($token, bool $isValid) => $isValid && $token->tokenable instanceof User && $token->tokenable->canAccessApp()
        );
    }
}
