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
use App\Http\Controllers\Api\Exam\QuestionController;
use App\Http\Controllers\Api\Exam\ExamResultController;

// Finance
use App\Http\Controllers\Api\Finance\InvoiceController;
use App\Http\Controllers\Api\Finance\PaymentController;
use App\Http\Controllers\Api\Finance\PayrollController;
use App\Http\Controllers\Api\Finance\OperationalExpenseController;
use App\Http\Controllers\Api\ParentPortal\ParentBillingController;
use App\Http\Controllers\Api\TentorPortal\TentorHonorController;

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
use App\Http\Controllers\Api\TentorPortal\TentorExamResultController;

// StudentPortal
use App\Http\Controllers\Api\StudentPortal\StudentExamController;
use App\Http\Controllers\Api\StudentPortal\StudentProgressReportController;
use App\Http\Controllers\Api\StudentPortal\StudentLearningController;
use App\Http\Controllers\Api\TentorPortal\TentorProgressNoteController;
use App\Http\Controllers\Api\TentorPortal\TentorProfileController;
use App\Http\Controllers\Api\ParentPortal\ParentProgressReportController;
use App\Http\Controllers\Api\Academic\ProgressReportController;
use App\Http\Controllers\Api\Academic\ParentRequestController;
use App\Http\Controllers\Api\ParentPortal\ParentPortalController;



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

// Website Public Content (CMS): hanya baca + kirim formulir pendaftaran (lead)
Route::prefix('website')->group(function () {
    Route::get('articles/slug/{slug}', [ArticleController::class, 'showBySlug']);
    Route::get('activities/{activity}', [ActivityController::class, 'showPublic']);

    Route::apiResource('company-profiles', CompanyProfileController::class)->only(['index', 'show']);
    Route::apiResource('banners', BannerController::class)->only(['index', 'show']);
    Route::apiResource('packages', PackageController::class)->only(['index', 'show']);
    Route::apiResource('testimonials', TestimonialController::class)->only(['index', 'show']);
    Route::apiResource('activities', ActivityController::class)->only(['index']);
    Route::apiResource('articles', ArticleController::class)->only(['index', 'show']);
    Route::apiResource('article-categories', ArticleCategoryController::class)->only(['index', 'show']);
    Route::apiResource('faqs', FaqController::class)->only(['index', 'show']);

    // Formulir pendaftaran calon siswa dari website (dibatasi agar tidak di-spam)
    Route::post('leads', [LeadController::class, 'store'])->middleware('throttle:10,1');
});

// Website CMS (kelola konten & data lead): khusus Admin
Route::prefix('website')
    ->middleware(['auth:sanctum', 'role:admin,super_admin'])
    ->group(function () {
        Route::apiResource('company-profiles', CompanyProfileController::class)->except(['index', 'show']);
        Route::apiResource('banners', BannerController::class)->except(['index', 'show']);
        Route::apiResource('packages', PackageController::class)->except(['index', 'show']);
        Route::apiResource('testimonials', TestimonialController::class)->except(['index', 'show']);
        Route::apiResource('activities', ActivityController::class)->except(['index', 'show']);
        Route::apiResource('activity-images', ActivityImageController::class)->only(['store', 'destroy']);
        Route::apiResource('articles', ArticleController::class)->except(['index', 'show']);
        Route::apiResource('article-categories', ArticleCategoryController::class)->except(['index', 'show']);
        Route::apiResource('faqs', FaqController::class)->except(['index', 'show']);

        Route::get('leads', [LeadController::class, 'index']);
        Route::get('leads/{lead}', [LeadController::class, 'show']);
        Route::match(['put', 'patch'], 'leads/{lead}', [LeadController::class, 'update']);
        Route::delete('leads/{lead}', [LeadController::class, 'destroy']);
        Route::post('leads/{lead}/convert', [LeadController::class, 'convert']);
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

    // Upload Media (gambar website, dokumen modul): khusus Admin
    Route::prefix('uploads')->middleware('role:admin,super_admin')->group(function () {
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
        Route::get('users/options', [UserController::class, 'options']);
        Route::patch('users/{user}/toggle', [UserController::class, 'toggleStatus']);
        Route::patch('users/{user}/reset-password', [UserController::class, 'resetPassword']);
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
            Route::get('/sessions', [ScheduleController::class, 'sessions']);
            Route::post('/wizard', [ScheduleController::class, 'storeWizard']);
            Route::put('/sessions/{session}/reschedule', [ScheduleController::class, 'rescheduleSession']);
            Route::post('/wizard/validate', [ScheduleController::class, 'validateWizard']);
            Route::post('/sessions/validate-reschedule', [ScheduleController::class, 'validateReschedule']);
            Route::put('/sessions/{session}/cancel', [ScheduleController::class, 'cancelSession']);
            Route::put('/sessions/{session}/details', [ScheduleController::class, 'updateSessionDetails']);
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

        Route::prefix('exams/{exam}')->group(function () {
            Route::patch('/status', [ExamController::class, 'changeStatus']);
            Route::get('/questions', [QuestionController::class, 'index']);
            Route::post('/questions', [QuestionController::class, 'store']);
            Route::put('/questions/reorder', [QuestionController::class, 'reorder']);
            Route::put('/questions/{question}', [QuestionController::class, 'update']);
            Route::delete('/questions/{question}', [QuestionController::class, 'destroy']);
            Route::get('/results', [ExamResultController::class, 'index']);
        });
        Route::apiResource('exams', ExamController::class);
        Route::get('exam-results/{result}', [ExamResultController::class, 'show']);
        Route::put('exam-results/{result}/grade', [ExamResultController::class, 'grade']);

        // --- PENGAJUAN ORANG TUA / TENTOR ---
        Route::get('/requests/summary', [ParentRequestController::class, 'summary']);
        Route::get('/reschedule-requests', [ParentRequestController::class, 'index'])->defaults('type', 'reschedule');
        Route::patch('/reschedule-requests/{rescheduleRequest}/approve', [ParentRequestController::class, 'approveReschedule']);
        Route::patch('/reschedule-requests/{rescheduleRequest}/reject', [ParentRequestController::class, 'rejectReschedule']);
        Route::get('/student-registrations', [ParentRequestController::class, 'index'])->defaults('type', 'registration');
        Route::patch('/student-registrations/{registration}/approve', [ParentRequestController::class, 'approveRegistration']);
        Route::patch('/student-registrations/{registration}/reject', [ParentRequestController::class, 'rejectRegistration']);

        // --- RAPOR PERKEMBANGAN SISWA ---
        Route::prefix('progress-reports')->group(function () {
            Route::get('/', [ProgressReportController::class, 'index']);
            Route::get('/detail', [ProgressReportController::class, 'show']);
            Route::put('/general-note', [ProgressReportController::class, 'saveGeneralNote']);
            Route::post('/publish', [ProgressReportController::class, 'publish']);
            Route::post('/{report}/unpublish', [ProgressReportController::class, 'unpublish']);
            Route::get('/semester', [ProgressReportController::class, 'semester']);
            Route::get('/semester/detail', [ProgressReportController::class, 'semesterShow']);
        });

        // --- KEUANGAN: TAGIHAN, PEMBAYARAN, HONOR, PENGELUARAN ---
        Route::prefix('finance')->group(function () {
            Route::get('/invoices', [InvoiceController::class, 'index']);
            Route::post('/invoices', [InvoiceController::class, 'store']);
            Route::post('/invoices/generate', [InvoiceController::class, 'generate']);
            Route::get('/invoices/{invoice}', [InvoiceController::class, 'show']);
            Route::patch('/invoices/{invoice}/cancel', [InvoiceController::class, 'cancel']);

            Route::get('/payments', [PaymentController::class, 'index']);
            Route::post('/payments', [PaymentController::class, 'store']);
            Route::get('/payments/{payment}', [PaymentController::class, 'show']);
            Route::get('/payments/{payment}/proof', [PaymentController::class, 'proof']);
            Route::patch('/payments/{payment}/approve', [PaymentController::class, 'approve']);
            Route::patch('/payments/{payment}/reject', [PaymentController::class, 'reject']);

            Route::get('/payrolls', [PayrollController::class, 'index']);
            Route::get('/payrolls/preview', [PayrollController::class, 'preview']);
            Route::post('/payrolls/generate', [PayrollController::class, 'generate']);
            Route::get('/payrolls/{payroll}', [PayrollController::class, 'show']);
            Route::patch('/payrolls/{payroll}/approve', [PayrollController::class, 'approve']);
            Route::post('/payrolls/{payroll}/transfers', [PayrollController::class, 'transfer']);
            Route::delete('/payrolls/{payroll}', [PayrollController::class, 'destroy']);
            Route::get('/tentor-rates', [PayrollController::class, 'rates']);
            Route::patch('/tentor-rates/{tentor}', [PayrollController::class, 'updateRate']);

            Route::get('/cashflow', [OperationalExpenseController::class, 'cashflow']);
            Route::get('/expenses', [OperationalExpenseController::class, 'index']);
            Route::post('/expenses', [OperationalExpenseController::class, 'store']);
            Route::put('/expenses/{expense}', [OperationalExpenseController::class, 'update']);
            Route::delete('/expenses/{expense}', [OperationalExpenseController::class, 'destroy']);
        });

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
        // Tagihan & pembayaran anak
        Route::get('/invoices', [ParentBillingController::class, 'invoices']);
        Route::get('/invoices/{id}', [ParentBillingController::class, 'showInvoice']);
        Route::post('/invoices/{id}/payments', [ParentBillingController::class, 'submitPayment']);
        Route::get('/payments', [ParentBillingController::class, 'payments']);
        Route::get('/payments/{id}/proof', [ParentBillingController::class, 'proof']);

        // Dashboard, jadwal & pindah jadwal, hasil ujian
        Route::get('/dashboard', [ParentPortalController::class, 'dashboard']);
        Route::get('/schedules', [ParentPortalController::class, 'schedules']);
        Route::post('/sessions/{session}/reschedule-requests', [ParentPortalController::class, 'requestReschedule']);
        Route::get('/reschedule-requests', [ParentPortalController::class, 'rescheduleRequests']);
        Route::patch('/reschedule-requests/{id}/cancel', [ParentPortalController::class, 'cancelReschedule']);
        Route::get('/exam-results', [ParentPortalController::class, 'examResults']);

        // Profil & pendaftaran anak
        Route::get('/profile', [ParentPortalController::class, 'profile']);
        Route::put('/profile', [ParentPortalController::class, 'updateProfile']);
        Route::put('/password', [ParentPortalController::class, 'updatePassword']);
        Route::get('/registration-options', [ParentPortalController::class, 'registrationOptions']);
        Route::get('/student-registrations', [ParentPortalController::class, 'registrations']);
        Route::post('/student-registrations', [ParentPortalController::class, 'storeRegistration']);
        Route::patch('/student-registrations/{id}/cancel', [ParentPortalController::class, 'cancelRegistration']);

        // Rapor anak (yang sudah diterbitkan)
        Route::get('/progress-reports', [ParentProgressReportController::class, 'reports']);
        Route::get('/progress-reports/semester', [ParentProgressReportController::class, 'semester']);
        Route::get('/progress-reports/semester/detail', [ParentProgressReportController::class, 'semesterShow']);
        Route::get('/progress-reports/{id}', [ParentProgressReportController::class, 'showReport']);

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
        Route::get('/reschedule-requests', [TentorScheduleController::class, 'rescheduleRequests']);
        Route::patch('/reschedule-requests/{id}/cancel', [TentorScheduleController::class, 'cancelReschedule']);
        Route::get('/sessions/{id}/workspace', [TentorScheduleController::class, 'showWorkspace']);
        Route::get('/sessions/{id}/reference-data', [TentorScheduleController::class, 'getReferenceData']);
        Route::post('/sessions/{id}/activities', [TentorScheduleController::class, 'storeActivity']);
        Route::put('/sessions/{id}/activities/reorder', [TentorScheduleController::class, 'reorderActivities']);
        Route::patch('/sessions/{id}/activities/{activity}/start', [TentorScheduleController::class, 'startActivity']);
        Route::patch('/sessions/{id}/activities/{activity}/complete', [TentorScheduleController::class, 'completeActivity']);
        Route::patch('/sessions/{id}/activities/{activity}/cancel', [TentorScheduleController::class, 'cancelActivity']);
        Route::delete('/sessions/{id}/activities/{activity}', [TentorScheduleController::class, 'deleteActivity']);

        // Riwayat honor
        Route::get('/honor', [TentorHonorController::class, 'index']);

        // Hasil ujian & penilaian essay
        Route::get('/exam-results', [TentorExamResultController::class, 'index']);
        Route::get('/exam-results/{id}', [TentorExamResultController::class, 'show']);
        Route::put('/exam-results/{id}/grade', [TentorExamResultController::class, 'grade']);

        // Profil, password, dan murid
        Route::get('/profile', [TentorProfileController::class, 'show']);
        Route::put('/profile', [TentorProfileController::class, 'update']);
        Route::put('/password', [TentorProfileController::class, 'updatePassword']);
        Route::get('/students', [TentorProfileController::class, 'students']);

        // Catatan perkembangan siswa untuk rapor
        Route::get('/progress-notes', [TentorProgressNoteController::class, 'notes']);
        Route::put('/progress-notes', [TentorProgressNoteController::class, 'saveNotes']);
    });


/*
|--------------------------------------------------------------------------
| 6. STUDENT PORTAL ROUTES
|--------------------------------------------------------------------------
*/

Route::prefix('student')
    ->middleware(['auth:sanctum', 'role:siswa'])
    ->group(function () {
        // Ujian online
        Route::get('/exams', [StudentExamController::class, 'index']);
        Route::post('/exams/{exam}/start', [StudentExamController::class, 'start']);
        Route::get('/exam-results/{id}', [StudentExamController::class, 'show']);
        Route::put('/exam-results/{id}/answers', [StudentExamController::class, 'saveAnswer']);
        Route::post('/exam-results/{id}/submit', [StudentExamController::class, 'submit']);

        // Pembelajaran: dashboard, jadwal & aktivitas sesi, materi
        Route::get('/dashboard', [StudentLearningController::class, 'dashboard']);
        Route::get('/sessions', [StudentLearningController::class, 'sessions']);
        Route::get('/sessions/{id}', [StudentLearningController::class, 'showSession']);
        Route::get('/materials', [StudentLearningController::class, 'materials']);

        // Rapor (yang sudah diterbitkan)
        Route::get('/progress-reports', [StudentProgressReportController::class, 'reports']);
        Route::get('/progress-reports/semester', [StudentProgressReportController::class, 'semester']);
        Route::get('/progress-reports/semester/detail', [StudentProgressReportController::class, 'semesterShow']);
        Route::get('/progress-reports/{id}', [StudentProgressReportController::class, 'showReport']);
    });
