<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\Admin\StudentController;
use App\Http\Controllers\Api\Admin\ParentController;
use App\Http\Controllers\Api\Admin\TentorController;
use App\Http\Controllers\Api\Admin\SubjectController;
use App\Http\Controllers\Api\Admin\TentorSubjectController;
use App\Http\Controllers\Api\Academic\ClassController;
use App\Http\Controllers\Api\Academic\LearningLocationController;
use App\Http\Controllers\Api\Academic\ScheduleController;
use App\Http\Controllers\Api\Academic\ClassStudentController;
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


Route::post('/login',[AuthController::class,'login']);

Route::get('/debug-provider', function () {
    return config('auth.providers.users');
});

Route::prefix('website')->group(function () {
    Route::post('/leads/{lead}/convert',[LeadController::class,'convert']);
    Route::get('articles/slug/{slug}',[ArticleController::class,'showBySlug']);
    Route::get('activities/{activity}',[ActivityController::class,'showPublic']);

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
        // dst
});

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile',[AuthController::class,'profile']);
    Route::post('/logout',[AuthController::class,'logout']);
    Route::get('/dashboard',[DashboardController::class,'index']);

});

Route::prefix('admin')->middleware(['auth:sanctum','role:admin,super_admin'])
    ->group(function () {
        Route::apiResource('users',UserController::class);
        Route::apiResource('parents',ParentController::class);
        Route::apiResource('students',StudentController::class);

        Route::apiResource('tentors',TentorController::class);
        // Tentor -> Subject
        Route::prefix('tentors/{tentor}/subjects')->group(function () {
            Route::get('/', [TentorSubjectController::class, 'index']);
            Route::put('/', [TentorSubjectController::class, 'assign']);
            Route::delete('/{subject}', [TentorSubjectController::class, 'remove']);
        });

        Route::apiResource('subjects',SubjectController::class);
        Route::apiResource('classes',ClassController::class);
        // Class -> Student
        Route::prefix('classes/{class}/students')->group(function () {
            Route::get('/', [ClassStudentController::class, 'index']);
            Route::put('/', [ClassStudentController::class, 'assign']);
            Route::delete('/{student}', [ClassStudentController::class, 'remove']);
        });
        
        Route::apiResource('locations',LearningLocationController::class);
        Route::get('schedules/statistics',[ScheduleController::class, 'statistics']);
        Route::apiResource('schedules',ScheduleController::class);
    });

Route::prefix('parent')->middleware(['auth:sanctum','role:orang_tua'])
    ->group(function () {
        // Route::get('/profile',[ProfileController::class,'show']);
        // Route::put('/profile',[ProfileController::class,'update']);
        // Route::get('/students',[ParentStudentController::class,'index']);
        // Route::post('/students',[ParentStudentController::class,'store']);
        // Route::get('/students/{student}',[ParentStudentController::class,'show']);
    });

Route::prefix('tentor')->middleware(['auth:sanctum','role:tentor'])
    ->group(function () {
        // Route::get('/dashboard',[TutorDashboardController::class,'index']);
        // Route::get('/schedules',[TutorScheduleController::class,'index']);
    });

Route::prefix('uploads')->group(function () {
    Route::post('image', [UploadController::class, 'image']);
});

// Route::post('/login',[AuthController::class, 'login']);


// Route::middleware('auth:sanctum','role:admin')
//     ->group(function () {

//         // Route::get('/admin/dashboard', function () {
//         //     return response()->json(['message' => 'Dashboard Admin']);
//         // });
//         Route::get('/profile',[AuthController::class, 'profile']);
//         Route::post('/logout',[AuthController::class, 'logout']);

//         // route user
//         Route::get('/users',[UserController::class,'index']);
//         Route::get('/users/{id}',[UserController::class,'show']);
//         Route::post('/users',[UserController::class,'store']);
//         Route::put('/users/{id}',[UserController::class,'update']);
//         Route::delete('/users/{id}',[UserController::class,'destroy']);
        
//         // Route Siswa
//         Route::get('/students',[StudentController::class,'index']);
//         Route::get('/students/{id}',[StudentController::class,'show']);
//         Route::post('/students',[StudentController::class,'store']);
//         Route::put('/students/{id}',[StudentController::class,'update']);
//         Route::delete('/students/{id}',[StudentController::class,'destroy']);

//         // Route Parents
//         Route::get('/parents',[ParentController::class,'index']);
//         Route::get('/parents/{id}',[ParentController::class,'show']);
//         Route::post('/parents',[ParentController::class,'store']);
//         Route::put('/parents/{id}',[ParentController::class,'update']);
//         Route::delete('/parents/{id}',[ParentController::class,'destroy']);
//         Route::post('/parents/{id}/students',[ParentController::class,'attachStudent']);

//         // Route Tutor
//         Route::apiResource('tentors',TutorController::class);
//         Route::post('/tentors/{id}/subjects',[TutorSubjectController::class, 'assign']);
//         Route::get('/tentor-subjects', [TutorSubjectController::class, 'index']);
//         Route::post('/tentor-subjects', [TutorSubjectController::class, 'store']);
//         Route::get('/tentor-subjects/{id}', [TutorSubjectController::class, 'show']);
//         Route::put('/tentor-subjects/{id}', [TutorSubjectController::class, 'update']);
//         Route::delete('/tentor-subjects/{id}', [TutorSubjectController::class, 'destroy']);

//         // Subject
//         Route::apiResource('subjects',SubjectController::class);

//         // Class
//         Route::get('/classes', [ClassController::class, 'index']);
//         Route::post('/classes', [ClassController::class, 'store']);
//         Route::get('/classes/{id}', [ClassController::class, 'show']);
//         Route::put('/classes/{id}', [ClassController::class, 'update']);
//         Route::delete('/classes/{id}', [ClassController::class, 'destroy']);
//         Route::get('/class-students', [ClassStudentController::class,'index']);
//         Route::post('/class-students', [ClassStudentController::class,'store']);
//         Route::get('/class-students/{id}', [ClassStudentController::class,'show']);
//         Route::put('/class-students/{id}', [ClassStudentController::class,'update']);
//         Route::delete('/class-students/{id}', [ClassStudentController::class,'destroy']);

//         // Location class
//         Route::get('/locations', [LearningLocationController::class, 'index']);
//         Route::post('/locations', [LearningLocationController::class, 'store']);
//         Route::get('/locations/{id}', [LearningLocationController::class, 'show']);
//         Route::put('/locations/{id}', [LearningLocationController::class, 'update']);
//         Route::delete('/locations/{id}', [LearningLocationController::class, 'destroy']);

//         // JADWAL
//         Route::get('/schedules', [ScheduleController::class, 'index']);
//         Route::post('/schedules', [ScheduleController::class, 'store']);
//         Route::get('/schedules/{id}', [ScheduleController::class, 'show']);
//         Route::put('/schedules/{id}', [ScheduleController::class, 'update']);
//         Route::delete('/schedules/{id}', [ScheduleController::class, 'destroy']);

//         // LEAD
        
        
//     });

// Route::prefix('website')->group(function () {
//     Route::get('articles/slug/{slug}',[ArticleController::class,'showBySlug']);
//     Route::get('activities/{activity}',[ActivityController::class,'showPublic']);

//     Route::apiResource('company-profiles',CompanyProfileController::class);
//     Route::apiResource('banners',BannerController::class);
//     Route::apiResource('packages',PackageController::class);
//     Route::apiResource('testimonials',TestimonialController::class);
//     Route::apiResource('activities',ActivityController::class);
//     Route::apiResource('activity-images',ActivityImageController::class);
//     Route::apiResource('articles',ArticleController::class);
//     Route::apiResource('article-categories',ArticleCategoryController::class);
//     Route::apiResource('faqs',FaqController::class);
//     Route::apiResource('leads',LeadController::class);
//     Route::post('/leads/{lead}/convert',[LeadController::class, 'convert']);
// });

// Route::prefix('uploads')->group(function () {
//     Route::post('image', [UploadController::class, 'image']);
// });

// Route::prefix('dashboard')
//     ->middleware('auth:sanctum')
//     ->group(function () {
//         Route::get('/',[DashboardController::class,'index']);

//     });