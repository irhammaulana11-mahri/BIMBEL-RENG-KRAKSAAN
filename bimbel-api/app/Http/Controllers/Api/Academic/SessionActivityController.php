<?php

namespace App\Http\Controllers\Api\Academic;

use App\Http\Controllers\Controller;
use App\Http\Requests\Academic\SessionActivityRequest;
use App\Http\Resources\Academic\SessionActivityResource;
use App\Models\Academic\ScheduleSession;
use App\Models\Academic\SessionActivity;
use App\Services\Academic\SessionActivityService;
use Illuminate\Http\Request;

class SessionActivityController extends Controller
{
    private const RELATIONS = ['session','activityable','creator','updater',];

    public function __construct(protected SessionActivityService $activityService) {}

    public function index(Request $request) {
        $query = SessionActivity::query()->with(self::RELATIONS);

        if ($request->filled('schedule_session_id')) {
            $query->where('schedule_session_id',$request->schedule_session_id);
        }

        if ($request->filled('activity_type')) {
            $query->where('activity_type',strtoupper($request->activity_type));
        }

        if ($request->filled('status')) {
            $query->where('status',strtoupper($request->status));
        }

        $query ->orderBy('schedule_session_id') ->orderBy('display_order');
        $perPage = min(max((int) $request->get('perPage', 15), 1),100);

        return SessionActivityResource::collection($query->paginate($perPage));
    }


    public function show(SessionActivity $sessionActivity) {
        return new SessionActivityResource($sessionActivity->load(self::RELATIONS));
    }

    public function store(SessionActivityRequest $request) {
        $data = $request->validated();
        $session = ScheduleSession::findOrFail($data['schedule_session_id']);

        $activity = $this->activityService->create($session, $data);

        return new SessionActivityResource($activity->load(self::RELATIONS));
    }


    public function update(SessionActivityRequest $request,SessionActivity $sessionActivity) {
        $activity = $this->activityService->update($sessionActivity, $request->validated());

        return new SessionActivityResource($activity->load(self::RELATIONS));
    }

    public function cancel(SessionActivity $sessionActivity) {
        $activity = $this->activityService->cancel($sessionActivity);

        return new SessionActivityResource($activity->load(self::RELATIONS));
    }

    public function start(SessionActivity $sessionActivity) {
        $activity = $this->activityService->start($sessionActivity);

        return new SessionActivityResource($activity->load(self::RELATIONS));
    }


    public function complete(SessionActivity $sessionActivity) {
        $activity = $this->activityService->complete($sessionActivity);

        return new SessionActivityResource($activity->load(self::RELATIONS));
    }


    public function destroy(SessionActivity $sessionActivity) {
        $this->activityService->delete($sessionActivity);

        return response()->json([
            'success' => true,
            'message' => 'Aktivitas berhasil dihapus.',
        ]);
    }
}
