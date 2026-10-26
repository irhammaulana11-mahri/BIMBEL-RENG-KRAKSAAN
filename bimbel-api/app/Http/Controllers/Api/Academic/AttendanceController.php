<?php

namespace App\Http\Controllers\Api\Academic;

use App\Http\Controllers\Controller;
use App\Models\Academic\ScheduleSession;
use App\Services\Academic\AttendanceService;
use App\Http\Requests\Academic\BulkStudentAttendanceRequest;
use App\Http\Requests\Academic\GetAttendanceRequest;
use App\Http\Requests\Academic\GetStudentAttendanceSessionsRequest;
use App\Http\Requests\Academic\TentorAttendanceRequest;

class AttendanceController extends Controller {
    protected AttendanceService $attendanceService;

    public function __construct(AttendanceService $attendanceService) {
        $this->attendanceService = $attendanceService;
    }

    public function getStudentForm(ScheduleSession $session) {
        $result = $this->attendanceService->getStudentAttendanceForm($session);
        return response()->json($result, 200);
    }

    public function saveStudentBulk(BulkStudentAttendanceRequest $request, ScheduleSession $session) {
        $result = $this->attendanceService->saveBulkStudentAttendance($session, $request->validated());
        return response()->json($result, $result['success'] ? 200 : $result['code']);
    }

    public function getTentorLogs(GetAttendanceRequest $request) {
        $data = $this->attendanceService->getTentorAttendances($request->validated());
        return response()->json(['success' => true, 'data' => $data], 200);
    }

    public function saveTentor(TentorAttendanceRequest $request, ScheduleSession $session) {
        $result = $this->attendanceService->saveTentorAttendance($session, $request->validated());
        return response()->json($result, $result['success'] ? 200 : $result['code']);
    }

    public function getStudentSessions(GetStudentAttendanceSessionsRequest $request) {
        $data = $this->attendanceService->getStudentSessions($request->validated());
        return response()->json(['success' => true, 'data' => $data], 200);
    }
}
