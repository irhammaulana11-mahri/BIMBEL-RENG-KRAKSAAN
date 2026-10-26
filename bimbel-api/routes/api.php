<?php

use Illuminate\Support\Facades\Route;

// Auth & Core
use App\Http\Controllers\Api\Auth\AuthController;
use App\Http\Controllers\Api\Admin\DashboardController;
use App\Http\Controllers\Api\Common\UploadController;
use App\Http\Controllers\Api\Common\FileViewerController;

// Admin Master
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\Admin\ParentController;
use App\Http\Controllers\Api\Admin\StudentController;
use App\Http\Controllers\Api\Admin\TentorController;
use App\Http\Controllers\Api\Admin\SubjectController;
use App\Http\Controllers\Api\Admin\TentorSubjectController;
use App\Http\Controllers\Api\Admin\EducationLevelController;

// Academic
use App\Http\Controllers\Api\Academic\ClassController;
use App\Http\Controllers\Api\Academic\LearningLocationController;
use App\Http\Controllers\Api\Academic\ScheduleController;
use App\Http\Controllers\Api\Academic\ClassStudentController;
use App\Http\Controllers\Api\Academic\CurriculumController;
use App\Http\Controllers\Api\Academic\MaterialController;
use App\Http\Controllers\Api\Academic\AttendanceController;
use App\Http\Controllers\Api\Academic\SessionActivityController;

// Exam
use App\Http\Controllers\Api\Exam\ExamController;

// Website Public / CMS
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

// TentorPortal
use App\Http\Controllers\Api\TentorPortal\TentorDashboardController;
use App\Http\Controllers\Api\TentorPortal\TentorScheduleController;



/*
|--------------------------------------------------------------------------
| 1. PUBLIC ROUTES (Tanpa Autentikasi)
|--------------------------------------------------------------------------
*/

// Authentication
Route::post('/login', [AuthController::class, 'login']);

// Protected File Streaming Streamed / Protected Viewer
Route::get('files/view/{folder}/{filename}', [FileViewerController::class, 'streamFile'])
    ->name('api.files.view');

// Debuging (Opsional untuk Development)
Route::get('/debug-provider', function () {
    return config('auth.providers.users');
});

// Website Public Content (CMS)
Route::prefix('website')->group(function () {
    Route::post('/leads/{lead}/convert', [LeadController::class, 'convert']);
    Route::get('articles/slug/{slug}', [ArticleController::class, 'showBySlug']);
    Route::get('activities/{activity}', [ActivityController::class, 'showPublic']);

    Route::apiResource('company-profiles', CompanyProfileController::class);
    Route::apiResource('banners', BannerController::class);
    Route::apiResource('packages', PackageController::class);
    Route::apiResource('testimonials', TestimonialController::class);
    Route::apiResource('activities', ActivityController::class);
    Route::apiResource('activity-images', ActivityImageController::class);
    Route::apiResource('articles', ArticleController::class);
    Route::apiResource('article-categories', ArticleCategoryController::class);
    Route::apiResource('faqs', FaqController::class);
    Route::apiResource('leads', LeadController::class);
});


/*
|--------------------------------------------------------------------------
| 2. AUTHENTICATED COMMON ROUTES (Siswa, Tentor, Admin, Parent)
|--------------------------------------------------------------------------
*/

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/profile', [AuthController::class, 'profile']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Upload Media (Foto Profil, Dokumen Modul Pembelajaran)
    Route::prefix('uploads')->group(function () {
        Route::post('/image', [UploadController::class, 'image']);
        Route::post('/document', [UploadController::class, 'document']);
    });
});


/*
|--------------------------------------------------------------------------
| 3. ADMIN & SUPER ADMIN MANAGEMENT ROUTES
|--------------------------------------------------------------------------
*/

Route::prefix('admin')
    ->middleware(['auth:sanctum', 'role:admin,super_admin'])
    ->group(function () {

        // --- MASTER DATA USERS, PARENTS, STUDENTS ---
        Route::apiResource('users', UserController::class);
        Route::apiResource('parents', ParentController::class);

        Route::patch('students/{student}/toggle', [StudentController::class, 'toggleStatus']);
        Route::apiResource('students', StudentController::class);

        // --- MASTER JENJANG EDUCATION LEVEL ---
        Route::patch('education-levels/{education_level}/toggle', [EducationLevelController::class, 'toggleStatus']);
        Route::apiResource('education-levels', EducationLevelController::class)->except(['destroy', 'show']);

        // --- MASTER TENTOR ---
        Route::get('tentors/summary', [TentorController::class, 'summary']);
        Route::patch('tentors/{tentor}/toggle', [TentorController::class, 'toggleStatus']);
        Route::post('tentors/{tentor}/assign', [TentorController::class, 'assign']);
        Route::apiResource('tentors', TentorController::class);

        // Sub-resource Tentor -> Subject
        Route::prefix('tentors/{tentor}/subjects')->group(function () {
            Route::get('/', [TentorSubjectController::class, 'index']);
            Route::put('/', [TentorSubjectController::class, 'assign']);
            Route::delete('/{subject}', [TentorSubjectController::class, 'remove']);
        });

        // --- MASTER MATA PELAJARAN (SUBJECT) ---
        Route::get('subjects/statistics', [SubjectController::class, 'statistics']);
        Route::get('subjects/{subject}/schedules', [SubjectController::class, 'schedules']);
        Route::patch('subjects/{subject}/toggle', [SubjectController::class, 'toggleStatus']);
        Route::apiResource('subjects', SubjectController::class);

        // --- AKADEMIK: KURIKULUM & MATERI ---
        Route::patch('curriculums/{curriculum}/toggle', [CurriculumController::class, 'toggleStatus']);
        Route::apiResource('curriculums', CurriculumController::class);

        Route::patch('materials/{material}/toggle', [MaterialController::class, 'toggleStatus']);
        Route::apiResource('materials', MaterialController::class);

        // --- AKADEMIK: KELAS & ROMBEL ---
        Route::prefix('classes')->group(function () {    
            Route::get('summary', [ClassController::class, 'summary']);
            Route::get('available-subjects', [ClassController::class, 'getSubjectsForClass']);
            Route::get('available-tentors', [ClassController::class, 'getTentorsForClass']);
            Route::get('available-students', [ClassController::class, 'getStudentsForClass']);
            Route::get('unscheduled', [ClassController::class, 'unscheduled']);

            // Actions Preview DrawerDashboardTentor
            Route::put('{class}/subjects', [ClassController::class, 'updateSubjects']);
            Route::put('{class}/tentors', [ClassController::class, 'updateTentors']);
            Route::put('{class}/students', [ClassController::class, 'syncStudents']);
            Route::patch('{class}/toggle-status', [ClassController::class, 'toggleStatus']);
            Route::patch('{class}/progress-status', [ClassController::class, 'updateProgressStatus']);
            Route::post('{class}/duplicate', [ClassController::class, 'duplicate']);

            // Sub-resource Class -> Students
            Route::prefix('{class}/students')->group(function () {
                Route::get('/', [ClassStudentController::class, 'index']);
                Route::put('/', [ClassStudentController::class, 'assign']);
                Route::delete('/{student}', [ClassStudentController::class, 'remove']);
                });
        });
        Route::apiResource('classes', ClassController::class);

        // --- AKADEMIK: LOKASI, JADWAL & EXAM ---
        Route::patch('locations/{location}/toggle', [LearningLocationController::class, 'toggleStatus']);
        Route::apiResource('locations', LearningLocationController::class);
        
        Route::prefix('schedules')->group(function () {
            Route::get('/statistics', [ScheduleController::class, 'statistics']);
            Route::get('/sessions', [ScheduleController::class, 'sessions']);
            Route::post('/wizard', [ScheduleController::class, 'storeWizard']);
            Route::put('/sessions/{session}/reschedule', [ScheduleController::class, 'rescheduleSession']);
            Route::post('/wizard/validate', [ScheduleController::class, 'validateWizard']);
            Route::post('/sessions/validate-reschedule', [ScheduleController::class, 'validateReschedule']);
            Route::put('/sessions/{session}/cancel', [ScheduleController::class, 'cancelSession']);
            Route::put('/sessions=/{session}/details', [ScheduleController::class, 'updateSessionDetails']);
            Route::put('/{schedule}/pattern', [ScheduleController::class, 'updatePattern']);
            Route::put('/{schedule}/toggle-status', [ScheduleController::class, 'toggleStatus']);
        });
        Route::apiResource('schedules', ScheduleController::class);

        Route::prefix('session-activities')->group(function () {
            Route::get('/',[SessionActivityController::class, 'index']);
            Route::post('/',[SessionActivityController::class, 'store']);
            Route::get('/{sessionActivity}',[SessionActivityController::class, 'show']);
            Route::put('/{sessionActivity}',[SessionActivityController::class, 'update']);
            Route::patch('/{sessionActivity}/start',[SessionActivityController::class, 'start']);
            Route::patch('/{sessionActivity}/complete',[SessionActivityController::class, 'complete']);
            Route::patch('/{sessionActivity}/cancel',[SessionActivityController::class, 'cancel']);
            Route::delete('/{sessionActivity}',[SessionActivityController::class, 'destroy']);
        });

        Route::apiResource('exams', ExamController::class);

        Route::prefix('attendances')->group(function () {
            Route::get('/sessions/{session}/students', [AttendanceController::class, 'getStudentForm']);
            Route::post('/sessions/{session}/students', [AttendanceController::class, 'saveStudentBulk']);
            Route::put('/sessions/{session}/tentor', [AttendanceController::class, 'saveTentor']);
            Route::get('/tentors', [AttendanceController::class, 'getTentorLogs']);
            Route::get('/students', [AttendanceController::class, 'getStudentSessions']);
        });

    });


/*
|--------------------------------------------------------------------------
| 4. PARENT PORTAL ROUTES
|--------------------------------------------------------------------------
*/

Route::prefix('parent')
    ->middleware(['auth:sanctum', 'role:orang_tua'])
    ->group(function () {
        // Route::get('/profile', [ParentProfileController::class, 'show']);
        // Route::get('/students', [ParentStudentController::class, 'index']);
    });


/*
|--------------------------------------------------------------------------
| 5. TENTOR PORTAL ROUTES
|--------------------------------------------------------------------------
*/

Route::prefix('tentor')
    ->middleware(['auth:sanctum', 'role:tentor'])
    ->group(function () {
        Route::get('/dashboard', [TentorDashboardController::class, 'index']);
        Route::get('/schedules', [TentorScheduleController::class, 'index']);
        Route::get('/attendances', [TentorScheduleController::class, 'attendances']);
        Route::post('/sessions/{id}/start', [TentorScheduleController::class, 'startSession']);
        Route::post('/sessions/{id}/end', [TentorScheduleController::class, 'endSession']);
        Route::post('/sessions/{id}/attendance', [TentorScheduleController::class, 'saveAttendance']);
        Route::post('/sessions/{id}/reschedule-request', [TentorScheduleController::class, 'requestReschedule']);
        Route::get('/sessions/{id}/workspace', [TentorScheduleController::class, 'showWorkspace']);
        Route::get('/sessions/{id}/reference-data', [TentorScheduleController::class, 'getReferenceData']);
        Route::post('/sessions/{id}/activities', [TentorScheduleController::class, 'storeActivity']);
        Route::put('/sessions/{id}/activities/reorder', [TentorScheduleController::class, 'reorderActivities']);
        Route::patch('/sessions/{id}/activities/{activity}/start', [TentorScheduleController::class, 'startActivity']);
        Route::patch('/sessions/{id}/activities/{activity}/complete', [TentorScheduleController::class, 'completeActivity']);
        Route::patch('/sessions/{id}/activities/{activity}/cancel', [TentorScheduleController::class, 'cancelActivity']);
        Route::delete('/sessions/{id}/activities/{activity}', [TentorScheduleController::class, 'deleteActivity']);
    });