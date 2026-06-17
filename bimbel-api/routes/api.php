<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\StudentController;
use App\Http\Controllers\Api\ParentController;
use App\Http\Controllers\Api\TutorController;
use App\Http\Controllers\Api\SubjectController;
use App\Http\Controllers\Api\TutorSubjectController;
use App\Http\Controllers\Api\ClassController;
use App\Http\Controllers\Api\LearningLocationController;
use App\Http\Controllers\Api\ScheduleController;
use App\Http\Controllers\Api\ClassStudentController;
use App\Http\Controllers\Api\Website\CompanyProfileController;
use App\Http\Controllers\Api\Website\BannerController;
use App\Http\Controllers\Api\Website\ActivityController;
use App\Http\Controllers\Api\Website\ActivityImageController;
use App\Http\Controllers\Api\Website\ArticleCategoryController;
use App\Http\Controllers\Api\Website\FaqController;
use App\Http\Controllers\Api\Website\LeadController;
use App\Http\Controllers\Api\Website\PackageController;
use App\Http\Controllers\Api\Website\TestimonialController;
use App\Http\Controllers\Api\Website\ArticleController;
use App\Http\Controllers\Api\Common\UploadController;
use App\Http\Controllers\Api\Admin\DashboardController;



Route::post('/login',[AuthController::class, 'login']);

Route::get('/test-api', function () {
    return response()->json([
        'success' => true
    ]);
});

Route::middleware('auth:sanctum','role:admin')
    ->group(function () {

        // Route::get('/admin/dashboard', function () {
        //     return response()->json(['message' => 'Dashboard Admin']);
        // });
        Route::get('/profile',[AuthController::class, 'profile']);
        Route::post('/logout',[AuthController::class, 'logout']);

        // route user
        Route::get('/users',[UserController::class,'index']);
        Route::get('/users/{id}',[UserController::class,'show']);
        Route::post('/users',[UserController::class,'store']);
        Route::put('/users/{id}',[UserController::class,'update']);
        Route::delete('/users/{id}',[UserController::class,'destroy']);
        
        // Route Siswa
        Route::get('/students',[StudentController::class,'index']);
        Route::get('/students/{id}',[StudentController::class,'show']);
        Route::post('/students',[StudentController::class,'store']);
        Route::put('/students/{id}',[StudentController::class,'update']);
        Route::delete('/students/{id}',[StudentController::class,'destroy']);

        // Route Parents
        Route::get('/parents',[ParentController::class,'index']);
        Route::get('/parents/{id}',[ParentController::class,'show']);
        Route::post('/parents',[ParentController::class,'store']);
        Route::put('/parents/{id}',[ParentController::class,'update']);
        Route::delete('/parents/{id}',[ParentController::class,'destroy']);
        Route::post('/parents/{id}/students',[ParentController::class,'attachStudent']);

        // Route Tutor
        Route::apiResource('tutors',TutorController::class);
        Route::post('/tutors/{id}/subjects',[TutorSubjectController::class, 'assign']);
        Route::get('/tutor-subjects', [TutorSubjectController::class, 'index']);
        Route::post('/tutor-subjects', [TutorSubjectController::class, 'store']);
        Route::get('/tutor-subjects/{id}', [TutorSubjectController::class, 'show']);
        Route::put('/tutor-subjects/{id}', [TutorSubjectController::class, 'update']);
        Route::delete('/tutor-subjects/{id}', [TutorSubjectController::class, 'destroy']);

        // Subject
        Route::apiResource('subjects',SubjectController::class);

        // Class
        Route::get('/classes', [ClassController::class, 'index']);
        Route::post('/classes', [ClassController::class, 'store']);
        Route::get('/classes/{id}', [ClassController::class, 'show']);
        Route::put('/classes/{id}', [ClassController::class, 'update']);
        Route::delete('/classes/{id}', [ClassController::class, 'destroy']);
        Route::get('/class-students', [ClassStudentController::class,'index']);
        Route::post('/class-students', [ClassStudentController::class,'store']);
        Route::get('/class-students/{id}', [ClassStudentController::class,'show']);
        Route::put('/class-students/{id}', [ClassStudentController::class,'update']);
        Route::delete('/class-students/{id}', [ClassStudentController::class,'destroy']);

        // Location class
        Route::get('/locations', [LearningLocationController::class, 'index']);
        Route::post('/locations', [LearningLocationController::class, 'store']);
        Route::get('/locations/{id}', [LearningLocationController::class, 'show']);
        Route::put('/locations/{id}', [LearningLocationController::class, 'update']);
        Route::delete('/locations/{id}', [LearningLocationController::class, 'destroy']);

        // JADWAL
        Route::get('/schedules', [ScheduleController::class, 'index']);
        Route::post('/schedules', [ScheduleController::class, 'store']);
        Route::get('/schedules/{id}', [ScheduleController::class, 'show']);
        Route::put('/schedules/{id}', [ScheduleController::class, 'update']);
        Route::delete('/schedules/{id}', [ScheduleController::class, 'destroy']);

        
    });

Route::prefix('website')->group(function () {

    Route::apiResource('company-profiles',CompanyProfileController::class);
    Route::apiResource('banners',BannerController::class);
    Route::apiResource('packages',PackageController::class);
    Route::apiResource('testimonials',TestimonialController::class);
    Route::apiResource('activities',ActivityController::class);
    Route::apiResource('activity-images',ActivityImageController::class);
    Route::apiResource('articles',ArticleController::class);
    Route::apiResource('article-categories',ArticleCategoryController::class);
    Route::apiResource('faqs',FaqController::class);
    Route::apiResource('leads',LeadController::class);
});

Route::prefix('uploads')->group(function () {
    Route::post('image', [UploadController::class, 'image']);
});

Route::prefix('dashboard')
    ->middleware('auth:sanctum')
    ->group(function () {

        Route::get(
            '/',
            [DashboardController::class,'index']
        );

    });