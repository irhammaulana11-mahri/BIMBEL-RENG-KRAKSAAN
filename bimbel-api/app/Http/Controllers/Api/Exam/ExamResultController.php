<?php

namespace App\Http\Controllers\Api\Exam;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exam\GradeExamRequest;
use App\Http\Resources\Exam\ExamResultDetailResource;
use App\Http\Resources\Exam\ExamResultResource;
use App\Models\Exam\Exam;
use App\Models\Exam\ExamResult;
use App\Services\Exam\ExamAttemptService;
use Illuminate\Http\Request;

/**
 * Hasil ujian & penilaian essay oleh Admin.
 */
class ExamResultController extends Controller
{
    private const RELATIONS = ['exam.subject', 'student', 'sessionActivity.session.schedule.classroom'];

    public function __construct(protected ExamAttemptService $attemptService) {}

    public function index(Request $request, Exam $exam)
    {
        $query = ExamResult::with(self::RELATIONS)
            ->where('exam_id', $exam->id)
            ->where('status', '!=', 'IN_PROGRESS');

        if ($request->filled('status')) {
            $query->where('status', strtoupper($request->status));
        }

        if ($request->filled('keyword')) {
            $query->whereHas('student', fn($q) => $q->where('full_name', 'ILIKE', '%' . trim($request->keyword) . '%'));
        }

        $results = $query->orderByDesc('submitted_at')->get();

        return ExamResultResource::collection($results)->additional([
            'summary' => [
                'total'   => $results->count(),
                'graded'  => $results->where('status', 'GRADED')->count(),
                'pending' => $results->where('status', 'SUBMITTED')->count(),
                'average' => round((float) $results->where('status', 'GRADED')->avg('score'), 2),
            ],
        ]);
    }

    public function show(ExamResult $result)
    {
        $result->load([...self::RELATIONS, 'answers']);
        return response()->json(['data' => (new ExamResultDetailResource($result))->resolve()]);
    }

    public function grade(GradeExamRequest $request, ExamResult $result)
    {
        $data = $request->validated();
        $result = $this->attemptService->grade($result->load('exam'), $data['grades'], $data['feedback'] ?? null);
        $result->load([...self::RELATIONS, 'answers']);

        return response()->json([
            'message' => 'Penilaian berhasil disimpan.',
            'data'    => (new ExamResultDetailResource($result))->resolve(),
        ]);
    }
}
