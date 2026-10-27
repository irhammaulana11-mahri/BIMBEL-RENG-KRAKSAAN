<?php
namespace App\Http\Controllers\Api\StudentPortal;

use App\Http\Controllers\Controller;
use App\Services\StudentPortal\StudentLearningService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

/**
 * Pembelajaran siswa: dashboard, jadwal & aktivitas sesi, materi belajar.
 */
class StudentLearningController extends Controller {

    public const MAX_SCHEDULE_RANGE_DAYS = 62;

    public function __construct(protected StudentLearningService $service) {}

    public function dashboard() {
        return response()->json(['success' => true, 'data' => $this->service->dashboard($this->service->currentStudent())]);
    }

    public function sessions(Request $request) {
        $request->validate([
            'from' => ['required', 'date_format:Y-m-d'],
            'to'   => ['required', 'date_format:Y-m-d', 'after_or_equal:from'],
        ], [
            'from.required'     => 'Tanggal awal wajib diisi.',
            'to.required'       => 'Tanggal akhir wajib diisi.',
            'to.after_or_equal' => 'Tanggal akhir harus setelah tanggal awal.',
        ]);
        if (Carbon::parse($request->from)->diffInDays(Carbon::parse($request->to)) > self::MAX_SCHEDULE_RANGE_DAYS) {
            throw ValidationException::withMessages(['to' => 'Rentang tanggal maksimal ' . self::MAX_SCHEDULE_RANGE_DAYS . ' hari.']);
        }

        return response()->json([
            'success' => true,
            'data'    => $this->service->sessions($this->service->currentStudent(), $request->from, $request->to),
        ]);
    }

    public function showSession($id) {
        return response()->json(['success' => true, 'data' => $this->service->sessionDetail($this->service->currentStudent(), $id)]);
    }

    public function materials(Request $request) {
        $request->validate([
            'subject_id' => ['nullable', 'uuid'],
            'keyword'    => ['nullable', 'string', 'max:100'],
        ]);

        return response()->json([
            'success' => true,
            'data'    => $this->service->materials($this->service->currentStudent(), $request->only(['subject_id', 'keyword'])),
        ]);
    }
}
