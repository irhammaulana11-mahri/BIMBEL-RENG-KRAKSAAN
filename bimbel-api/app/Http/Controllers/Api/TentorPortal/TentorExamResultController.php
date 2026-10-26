<?php
namespace App\Http\Controllers\Api\TentorPortal;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exam\GradeExamRequest;
use App\Http\Resources\Exam\ExamResultDetailResource;
use App\Http\Resources\Exam\ExamResultResource;
use App\Models\Admin\Tentor;
use App\Models\Exam\ExamResult;
use App\Services\Exam\ExamAttemptService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Hasil ujian siswa pada sesi milik tentor + penilaian essay.
 */
class TentorExamResultController extends Controller {
    private const RELATIONS = ['exam.subject', 'student', 'sessionActivity.session.schedule.classroom'];

    public function __construct(protected ExamAttemptService $attemptService) {}

    // GET: Daftar hasil ujian (filter status / aktivitas sesi)
    public function index(Request $request) {
        $query = $this->ownedResults()->with(self::RELATIONS)->where('status', '!=', 'IN_PROGRESS');

        if ($request->filled('status')) {
            $query->where('status', strtoupper($request->status));
        }

        if ($request->filled('session_activity_id')) {
            $query->where('session_activity_id', $request->session_activity_id);
        }

        if ($request->filled('keyword')) {
            $kw = '%' . trim($request->keyword) . '%';
            $query->where(fn($q) => $q
                ->whereHas('student', fn($sq) => $sq->where('full_name', 'ILIKE', $kw))
                ->orWhereHas('exam', fn($sq) => $sq->where('title', 'ILIKE', $kw)));
        }

        $results = $query->orderByRaw("CASE WHEN status = 'SUBMITTED' THEN 0 ELSE 1 END")
            ->orderByDesc('submitted_at')
            ->get();

        return response()->json([
            'success' => true,
            'data'    => ExamResultResource::collection($results),
            'summary' => [
                'pending' => $results->where('status', 'SUBMITTED')->count(),
                'graded'  => $results->where('status', 'GRADED')->count(),
            ],
        ]);
    }

    // GET: Detail jawaban siswa
    public function show($id) {
        $result = $this->ownedResults()->with([...self::RELATIONS, 'answers'])->findOrFail($id);
        return response()->json(['success' => true, 'data' => (new ExamResultDetailResource($result))->resolve()]);
    }

    // PUT: Nilai jawaban essay
    public function grade(GradeExamRequest $request, $id) {
        $result = $this->ownedResults()->with('exam')->findOrFail($id);
        $data = $request->validated();

        $result = $this->attemptService->grade($result, $data['grades'], $data['feedback'] ?? null);
        $result->load([...self::RELATIONS, 'answers']);

        return response()->json([
            'success' => true,
            'message' => 'Penilaian berhasil disimpan.',
            'data'    => (new ExamResultDetailResource($result))->resolve(),
        ]);
    }

    /**
     * Hasil dari aktivitas sesi yang diampu tentor, atau exam yang ditugaskan ke tentor.
     */
    private function ownedResults(): Builder {
        $tentorId = Tentor::where('user_id', Auth::id())->value('id');
        abort_unless($tentorId, 403, 'Akun ini tidak terhubung dengan data tentor.');

        return ExamResult::query()->where(fn($q) => $q
            ->whereHas('sessionActivity.session', fn($sq) => $sq->where('tentor_id', $tentorId))
            ->orWhereHas('exam', fn($sq) => $sq->where('tutor_id', $tentorId)));
    }
}
