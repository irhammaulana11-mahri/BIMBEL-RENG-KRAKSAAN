<?php

namespace App\Http\Controllers\Api\Academic;

use App\Http\Controllers\Controller;
use App\Services\Admin\MasterOverviewService;
use App\Models\Academic\Schedule;
use App\Models\Academic\ScheduleSession;
use App\Http\Resources\Academic\ScheduleResource;
use App\Http\Resources\Academic\ScheduleSessionResource;
use App\Services\Academic\ScheduleService;
use App\Http\Requests\Academic\ScheduleSessionRequest;
use App\Http\Requests\Academic\ScheduleRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Builder;


class ScheduleController extends Controller {
    protected ScheduleService $scheduleService;

    public function __construct(ScheduleService $scheduleService) {
        $this->scheduleService = $scheduleService;
    }

    public function index(Request $request) {
        $query = Schedule::query()
            ->with([
                'classroom',
                'subject',
                'tentor.user',
                'location',
            ]);

        // | Keyword Search
        if ($request->filled('keyword')) {
            $keyword = trim($request->keyword);
            $query->where(function (Builder $q) use ($keyword) {
                $q->where('room_name', 'ILIKE', "%{$keyword}%")
                    ->orWhereHas('classroom', function (Builder $classroom) use ($keyword) {
                        $classroom->where('name', 'ILIKE', "%{$keyword}%");
                    })

                    ->orWhereHas('subject', function (Builder $subject) use ($keyword) {
                        $subject->where('name', 'ILIKE', "%{$keyword}%");
                    })

                    ->orWhereHas('tentor', function (Builder $tentor) use ($keyword) {
                        $tentor->whereHas('user', function (Builder $user) use ($keyword) {
                            $user->where('name', 'ILIKE', "%{$keyword}%");
                        });
                    })

                    ->orWhereHas('location', function (Builder $location) use ($keyword) {
                        $location->where('location_name', 'ILIKE', "%{$keyword}%");
                    });
            });
        }


        // | Hari
        if ($request->filled('day_of_week')) {
            $query->where('day_of_week',$request->day_of_week);
        }

        // / Pada Query Filter Class Type:
        if ($request->filled('class_type')) {
            $query->whereHas('classroom', function (Builder $q) use ($request) {
                $q->where('class_type', $request->class_type);
            });
        }


        // | Sorting
        $query->orderBy('day_of_week')
                ->orderBy('start_time');

        // | Pagination
        $perPage = $request->integer('per_page',10);

        $schedules = $query
            ->paginate($perPage)
            ->withQueryString();

        return ScheduleResource::collection($schedules);
    }

    public function show(Schedule $schedule) {
        return new ScheduleResource(
            $schedule->load([
                'classroom',
                'subject',
                'tentor.user',
                'location'
            ])
        );
    }

    

    public function sessions(Request $request) {
        $filters = $request->only(['keyword', 'status', 'date']);
        $perPage = $request->integer('per_page', 15);
        $sessions = $this->scheduleService->getSessions($filters, $perPage);
        return ScheduleSessionResource::collection($sessions);
    }

    /**
     * Endpoint Buat Single Schedule + Generate Session
     */
    public function store(Request $request) {
        $validatedData = $request->validate([
            'class_id'             => ['required', 'uuid'],
            'subject_id'           => ['required', 'uuid'],
            'tentor_id'            => ['required', 'uuid'],
            'learning_location_id' => ['nullable', 'uuid'],
            'day_of_week'          => ['required', 'integer', 'between:0,6'],
            'start_time'           => ['required', 'date_format:H:i'],
            'end_time'             => ['required', 'date_format:H:i', 'after:start_time'],
            'room_name'            => ['nullable', 'string'],
            'meeting_url'          => ['nullable', 'string'],
            'start_date'           => ['required', 'date'],
            'meeting_target'       => ['required', 'integer', 'min:1'],
        ]);

        $result = $this->scheduleService->generateScheduleAndSessions($validatedData);

        if (!$result['success']) {
            return response()->json($result, 500);
        }

        return response()->json($result, 201);
    }


    /**
     * Endpoint Validasi Wizard Step 2
     */
    public function validateWizard(ScheduleRequest $request) {
        $data = $request->validated();
        $result = $this->scheduleService->validateWizardPatterns($data['patterns']);

        if (!$result['success']) {
            return response()->json($result, 422); // Unprocessable Entity untuk error validasi
        }

        return response()->json($result, 200);
    }
    
    /**
     * Endpoint Bulk Create (Sistem Wizard Schedule 5-Step)
     */
    public function storeWizard(ScheduleRequest $request) {
        $validatedData = $request->validated();

        $result = $this->scheduleService->generateWizardSchedules($validatedData);

        if (!$result['success']) {
            return response()->json($result, 500);
        }

        return response()->json($result, 201);
    }

    // --- ENDPOINTS SCHEDULE SESSION (OPERATIONAL) ---

    public function cancelSession(ScheduleSessionRequest $request, ScheduleSession $session) {
        $result = $this->scheduleService->cancelSession($session, $request->validated());
        return response()->json($result, $result['success'] ? 200 : ($result['code'] ?? 500));
    }

    // DELETE: hanya jadwal yang belum pernah berjalan (tanpa sesi berjalan/selesai & absensi)
    public function destroy(Schedule $schedule) {
        $result = $this->scheduleService->deleteSchedule($schedule);
        return response()->json($result, $result['success'] ? 200 : ($result['code'] ?? 500));
    }

    public function updateSessionDetails(ScheduleSessionRequest $request, ScheduleSession $session) {
        $result = $this->scheduleService->updateSessionDetails($session, $request->validated());
        return response()->json($result, $result['success'] ? 200 : 500);
    }

    public function validateReschedule(ScheduleSessionRequest $request) {
        $result = $this->scheduleService->validateRescheduleSession($request->validated());
        return response()->json($result, $result['success'] ? 200 : 422);
    }

    public function rescheduleSession(ScheduleSessionRequest $request, ScheduleSession $session) {
        $result = $this->scheduleService->rescheduleSession($session, $request->validated());
        return response()->json($result, $result['success'] ? 200 : 500);
    }

    public function updatePattern(ScheduleRequest $request, Schedule $schedule) {
        $result = $this->scheduleService->updateSchedulePattern($schedule, $request->validated());
        return response()->json($result, $result['success'] ? 200 : 500);
    }

    public function toggleStatus(ScheduleRequest $request, Schedule $schedule) {
        $result = $this->scheduleService->toggleScheduleStatus($schedule, $request->validated()['is_active']);
        return response()->json($result, 200);
    }

    // GET: Detail sesi untuk drawer (absensi nyata, absen tentor, aktivitas, riwayat)
    public function sessionOverview(ScheduleSession $session, MasterOverviewService $overview) {
        return response()->json(['data' => $overview->session($session)]);
    }

    // GET: Rekap sesi per status untuk drawer pola jadwal (master)
    public function patternOverview(Schedule $schedule, MasterOverviewService $overview) {
        return response()->json(['data' => $overview->schedulePattern($schedule)]);
    }
}
