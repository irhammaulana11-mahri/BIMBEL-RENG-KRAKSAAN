<?php

namespace App\Http\Controllers\Api\Exam;

use App\Http\Controllers\Controller;
use App\Models\Exam\Exam;
use App\Http\Requests\Exam\ExamRequest;
use App\Http\Resources\Exam\ExamResource;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;

class ExamController extends Controller
{
    public function index(Request $request)
    {
        $query = Exam::query()->with(['subject', 'tentor.user']);

        // Filter berdasarkan pencarian judul ujian
        if ($request->filled('keyword')) {
            $keyword = trim($request->keyword);
            $query->where('title', 'ILIKE', "%{$keyword}%");
        }

        // Filter berdasarkan subject_id jika diperlukan
        if ($request->filled('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        $query->orderBy('exam_date', 'desc');
        
        $perPage = $request->integer('per_page', 10);
        $exams = $query->paginate($perPage)->withQueryString();

        return ExamResource::collection($exams);
    }

    public function store(ExamRequest $request)
    {
        $exam = Exam::create($request->validated());
        return new ExamResource($exam->load(['subject', 'tentor.user']));
    }

    public function show(Exam $exam)
    {
        return new ExamResource($exam->load(['subject', 'tentor.user']));
    }

    public function update(ExamRequest $request, Exam $exam)
    {
        $exam->update($request->validated());
        return new ExamResource($exam->fresh(['subject', 'tentor.user']));
    }

    public function destroy(Exam $exam)
    {
        $exam->delete();
        return response()->json([
            'message' => 'Ujian berhasil dihapus.'
        ]);
    }
}