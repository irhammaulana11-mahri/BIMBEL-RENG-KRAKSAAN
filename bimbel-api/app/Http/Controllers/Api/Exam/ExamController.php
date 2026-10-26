<?php

namespace App\Http\Controllers\Api\Exam;

use App\Http\Controllers\Controller;
use App\Models\Exam\Exam;
use App\Http\Requests\Exam\ExamRequest;
use App\Http\Resources\Exam\ExamResource;
use App\Services\Exam\ExamService;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ExamController extends Controller
{
    private const RELATIONS = ['subject', 'tentor.user', 'classes'];

    public function __construct(protected ExamService $examService) {}

    public function index(Request $request)
    {
        $query = Exam::query()
            ->with(self::RELATIONS)
            ->withCount([
                'activeQuestions',
                'results' => fn($q) => $q->where('status', '!=', 'IN_PROGRESS'),
                'results as pending_results_count' => fn($q) => $q->where('status', 'SUBMITTED'),
            ]);

        // Filter berdasarkan pencarian judul ujian
        if ($request->filled('keyword')) {
            $keyword = trim($request->keyword);
            $query->where('title', 'ILIKE', "%{$keyword}%");
        }

        // Filter berdasarkan subject_id jika diperlukan
        if ($request->filled('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->filled('status')) {
            $query->where('status', strtoupper($request->status));
        }

        // Filter tanggal ujian: harian (Y-m-d) atau bulanan (Y-m)
        if ($request->filled('date')) {
            $query->whereDate('exam_date', $request->date);
        } elseif ($request->filled('month')) {
            $query->whereYear('exam_date', substr($request->month, 0, 4))
                  ->whereMonth('exam_date', substr($request->month, 5, 2));
        }

        $query->orderByDesc('created_at');

        $perPage = min(max($request->integer('per_page', 10), 1), 100);
        $exams = $query->paginate($perPage)->withQueryString();

        return ExamResource::collection($exams)->additional([
            'summary' => [
                'total'     => Exam::count(),
                'published' => Exam::where('status', 'PUBLISHED')->count(),
                'pending'   => \App\Models\Exam\ExamResult::where('status', 'SUBMITTED')->count(),
            ],
        ]);
    }

    public function store(ExamRequest $request)
    {
        $exam = $this->examService->create($request->validated());
        return new ExamResource($exam->load(self::RELATIONS));
    }

    public function show(Exam $exam)
    {
        return new ExamResource($exam->load(self::RELATIONS)->loadCount('activeQuestions'));
    }

    public function update(ExamRequest $request, Exam $exam)
    {
        $exam = $this->examService->update($exam, $request->validated());
        return new ExamResource($exam->load(self::RELATIONS));
    }

    public function changeStatus(Request $request, Exam $exam)
    {
        $data = $request->validate(['status' => ['required', Rule::in(Exam::STATUSES)]]);
        $exam = $this->examService->changeStatus($exam, $data['status']);

        return (new ExamResource($exam->load(self::RELATIONS)))->additional([
            'message' => 'Status ujian diperbarui.',
        ]);
    }

    public function destroy(Exam $exam)
    {
        $this->examService->delete($exam);
        return response()->json([
            'message' => 'Ujian berhasil dihapus.'
        ]);
    }
}
