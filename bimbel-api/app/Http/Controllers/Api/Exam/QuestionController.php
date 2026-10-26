<?php

namespace App\Http\Controllers\Api\Exam;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exam\QuestionRequest;
use App\Http\Resources\Exam\QuestionResource;
use App\Models\Exam\Exam;
use App\Models\Exam\Question;
use App\Services\Exam\ExamService;
use Illuminate\Http\Request;

class QuestionController extends Controller
{
    public function __construct(protected ExamService $examService) {}

    public function index(Exam $exam)
    {
        return QuestionResource::collection($exam->questions()->get())->additional([
            'meta' => [
                'is_locked'   => $this->examService->hasResults($exam),
                'total_score' => $exam->activeQuestions()->sum('score'),
            ],
        ]);
    }

    public function store(QuestionRequest $request, Exam $exam)
    {
        $question = $this->examService->createQuestion($exam, $request->validated());
        return new QuestionResource($question);
    }

    public function update(QuestionRequest $request, Exam $exam, Question $question)
    {
        abort_unless($question->exam_id === $exam->id, 404);

        return new QuestionResource($this->examService->updateQuestion($question, $request->validated()));
    }

    public function destroy(Exam $exam, Question $question)
    {
        abort_unless($question->exam_id === $exam->id, 404);

        $this->examService->deleteQuestion($question);
        return response()->json(['message' => 'Soal berhasil dihapus.']);
    }

    public function reorder(Request $request, Exam $exam)
    {
        $data = $request->validate([
            'question_ids'   => ['required', 'array', 'min:1'],
            'question_ids.*' => ['required', 'uuid', 'distinct'],
        ]);

        $this->examService->reorderQuestions($exam, $data['question_ids']);
        return response()->json(['message' => 'Urutan soal diperbarui.']);
    }
}
