<?php
namespace App\Http\Controllers\Api\ParentPortal;

use App\Http\Controllers\Controller;
use App\Http\Requests\Parent\ParentPortalRequest;
use App\Models\Academic\RescheduleRequest;
use App\Models\Admin\EducationLevel;
use App\Models\Admin\StudentRegistrationRequest;
use App\Models\Website\Package;
use App\Services\Academic\RescheduleRequestService;
use App\Services\Parent\ParentPortalService;
use App\Services\Student\StudentRegistrationRequestService;
use Carbon\Carbon;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Laravel\Sanctum\PersonalAccessToken;

/**
 * Portal orang tua: dashboard, jadwal & pengajuan pindah jadwal, hasil ujian,
 * profil, dan pengajuan pendaftaran anak.
 */
class ParentPortalController extends Controller {

    public const MAX_SCHEDULE_RANGE_DAYS = 62;

    public function __construct(
        protected ParentPortalService $portal,
        protected RescheduleRequestService $rescheduleService,
        protected StudentRegistrationRequestService $registrationService,
    ) {}

    public function dashboard() {
        return response()->json(['success' => true, 'data' => $this->portal->dashboard($this->portal->currentParent())]);
    }

    /*
    |--------------------------------------------------------------------------
    | JADWAL & PINDAH JADWAL
    |--------------------------------------------------------------------------
    */

    public function schedules(ParentPortalRequest $request) {
        if (Carbon::parse($request->from)->diffInDays(Carbon::parse($request->to)) > self::MAX_SCHEDULE_RANGE_DAYS) {
            throw ValidationException::withMessages(['to' => 'Rentang tanggal maksimal ' . self::MAX_SCHEDULE_RANGE_DAYS . ' hari.']);
        }

        $parent = $this->portal->currentParent();

        return response()->json([
            'success'  => true,
            'data'     => $this->portal->sessions($parent, $request->from, $request->to, $request->student_id),
            'children' => $this->portal->children($parent)->map(fn($c) => ['id' => $c['id'], 'name' => $c['name']]),
        ]);
    }

    public function requestReschedule(ParentPortalRequest $request, $sessionId) {
        $parent = $this->portal->currentParent();
        $session = $this->portal->findChildSession($parent, $sessionId, $request->student_id);
        $created = $this->rescheduleService->submit($session, 'PARENT', $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Pengajuan pindah jadwal terkirim. Admin akan mengonfirmasi.',
            'data'    => RescheduleRequestService::present($created->load(RescheduleRequestService::relations())),
        ], 201);
    }

    public function rescheduleRequests() {
        $requests = RescheduleRequest::with(RescheduleRequestService::relations())
            ->where('requested_by', Auth::id())
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        return response()->json(['success' => true, 'data' => $requests->map(fn($r) => RescheduleRequestService::present($r))]);
    }

    public function cancelReschedule($id) {
        abort_unless(Str::isUuid($id), 404, 'Pengajuan tidak ditemukan.');
        $request = RescheduleRequest::where('requested_by', Auth::id())->where('id', $id)->first();
        abort_unless($request, 404, 'Pengajuan tidak ditemukan.');
        $this->rescheduleService->cancel($request);

        return response()->json(['success' => true, 'message' => 'Pengajuan pindah jadwal dibatalkan.']);
    }

    /*
    |--------------------------------------------------------------------------
    | HASIL UJIAN
    |--------------------------------------------------------------------------
    */

    public function examResults(ParentPortalRequest $request) {
        $parent = $this->portal->currentParent();

        return response()->json([
            'success'  => true,
            'data'     => $this->portal->examResults($parent, $request->student_id),
            'children' => $this->portal->children($parent)->map(fn($c) => ['id' => $c['id'], 'name' => $c['name']]),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | PROFIL
    |--------------------------------------------------------------------------
    */

    public function profile() {
        $parent = $this->portal->currentParent();

        return response()->json([
            'success' => true,
            'data'    => [
                'id'           => $parent->id,
                'full_name'    => $parent->full_name,
                'email'        => $parent->user?->email,
                'phone'        => $parent->user?->phone,
                'occupation'   => $parent->occupation,
                'relationship' => $parent->relationship,
                'address'      => $parent->address,
                'children'     => $this->portal->children($parent),
            ],
        ]);
    }

    // Nama & email hanya diubah Admin
    public function updateProfile(ParentPortalRequest $request) {
        $parent = $this->portal->currentParent();
        $data = $request->validated();

        DB::transaction(function () use ($parent, $data) {
            $parent->update(['occupation' => $data['occupation'] ?? null, 'address' => $data['address'] ?? null]);
            $parent->user->update(['phone' => $data['phone'] ?? null]);
        });

        return response()->json(['success' => true, 'message' => 'Profil diperbarui.']);
    }

    public function updatePassword(ParentPortalRequest $request) {
        $user = Auth::user();
        $user->update(['password' => Hash::make($request->password)]);

        // Keluarkan sesi login di perangkat lain
        $current = $user->currentAccessToken();
        $user->tokens()
            ->when($current instanceof PersonalAccessToken, fn($q) => $q->where('id', '!=', $current->id))
            ->delete();

        return response()->json(['success' => true, 'message' => 'Password diperbarui. Sesi di perangkat lain telah dikeluarkan.']);
    }

    /*
    |--------------------------------------------------------------------------
    | PENDAFTARAN ANAK
    |--------------------------------------------------------------------------
    */

    public function registrationOptions() {
        return response()->json([
            'success' => true,
            'data'    => [
                'education_levels' => EducationLevel::where('is_active', true)->orderBy('sort_order')
                    ->get(['id', 'display_name', 'education_level'])
                    ->map(fn($l) => ['id' => $l->id, 'name' => $l->display_name, 'level' => $l->education_level]),
                'packages' => Package::where('is_active', true)->orderBy('display_order')
                    ->get(['id', 'package_name', 'education_level', 'class_type', 'default_price', 'meeting_per_month'])
                    ->map(fn($p) => [
                        'id' => $p->id, 'name' => $p->package_name, 'level' => $p->education_level,
                        'class_type' => $p->class_type, 'price' => (float) $p->default_price, 'meeting_per_month' => $p->meeting_per_month,
                    ]),
            ],
        ]);
    }

    public function registrations() {
        $parent = $this->portal->currentParent();
        $items = StudentRegistrationRequest::with(StudentRegistrationRequestService::relations())
            ->where('parent_id', $parent->id)
            ->orderByDesc('created_at')
            ->get();

        return response()->json(['success' => true, 'data' => $items->map(fn($r) => StudentRegistrationRequestService::present($r))]);
    }

    public function storeRegistration(ParentPortalRequest $request) {
        $created = $this->registrationService->submit($this->portal->currentParent(), $request->validated());

        return response()->json([
            'success' => true,
            'message' => 'Pendaftaran anak terkirim. Admin akan menghubungi Anda untuk konfirmasi.',
            'data'    => StudentRegistrationRequestService::present($created->load(StudentRegistrationRequestService::relations())),
        ], 201);
    }

    public function cancelRegistration($id) {
        $parent = $this->portal->currentParent();
        abort_unless(Str::isUuid($id), 404, 'Pengajuan tidak ditemukan.');
        $request = StudentRegistrationRequest::where('parent_id', $parent->id)->where('id', $id)->first();
        abort_unless($request, 404, 'Pengajuan tidak ditemukan.');
        $this->registrationService->cancel($request);

        return response()->json(['success' => true, 'message' => 'Pendaftaran dibatalkan.']);
    }
}
