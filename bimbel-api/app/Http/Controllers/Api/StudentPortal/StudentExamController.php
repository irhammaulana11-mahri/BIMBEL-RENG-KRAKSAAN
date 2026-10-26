<?php
namespace App\Http\Controllers\Api\StudentPortal;

use App\Http\Controllers\Controller;
use App\Http\Requests\Exam\ExamAnswerRequest;
use App\Http\Resources\Exam\ExamResource;
use App\Http\Resources\Exam\ExamResultDetailResource;
use App\Http\Resources\Exam\ExamResultResource;
use App\Http\Resources\Exam\StudentQuestionResource;
use App\Models\Exam\Exam;
use App\Models\Exam\ExamResult;
use App\Models\Exam\Question;
use App\Services\Exam\ExamAttemptService;
use App\Support\LocalTime;
use Illuminate\Http\Request;

/**
 * Ujian online siswa: daftar ujian, mengerjakan, dan melihat hasil.
 */
class StudentExamController extends Controller {

    public function __construct(protected ExamAttemptService $attemptService) {}

    // GET: Ujian tersedia, akan datang, dan riwayat
    public function index() {
        $student = $this->attemptService->currentStudent();
        $data = $this->attemptService->listForStudent($student);

        return response()->json([
            'success' => true,
            'data'    => [
                'available' => collect($data['available'])->map(fn($item) => array_merge($item, [
                    'closes_at'  => LocalTime::format($item['closes_at'], 'Y-m-d H:i'),
                    'expires_at' => LocalTime::format($item['expires_at'], 'Y-m-d H:i'),
                ])),
                'upcoming'  => ExamResource::collection($data['upcoming']),
                'history'   => $data['history']->map(fn($result) => (new ExamResultResource($result))
                                    ->additional(['hide_ungraded' => true])
                                    ->resolve()),
            ],
        ]);
    }

    // POST: Mulai / lanjutkan ujian
    public function start(Request $request, Exam $exam) {
        $data = $request->validate(['session_activity_id' => ['nullable', 'uuid']]);
        $student = $this->attemptService->currentStudent();

        $result = $this->attemptService->start($student, $exam, $data['session_activity_id'] ?? null);

        return response()->json(['success' => true, 'data' => ['result_id' => $result->id]]);
    }

    // GET: Lembar ujian (jika masih dikerjakan) atau hasil (jika sudah dikumpulkan)
    public function show($resultId) {
        $student = $this->attemptService->currentStudent();
        $result = $this->attemptService->findOwnedResult($student, $resultId);

        if ($result->status !== 'IN_PROGRESS') {
            $result->load(['exam.subject', 'student', 'answers', 'sessionActivity.session.schedule.classroom']);
            return response()->json([
                'success' => true,
                'data'    => array_merge(
                    ['mode_view' => 'RESULT'],
                    (new ExamResultDetailResource($result))->additional(['for_student' => true])->resolve()
                ),
            ]);
        }

        $exam = $result->exam->load('subject');
        $questions = Question::where('exam_id', $exam->id)->where('is_active', true)->orderBy('order_no')->get();
        $answers = $result->answers()->pluck('answer', 'question_id');

        return response()->json([
            'success' => true,
            'data'    => [
                'mode_view'         => 'ATTEMPT',
                'result_id'         => $result->id,
                'exam_title'        => $exam->title,
                'subject_name'      => $exam->subject->name ?? '-',
                'description'       => $exam->description,
                'duration'          => $exam->duration,
                'expires_at'        => LocalTime::format($result->expires_at, 'Y-m-d H:i:s'),
                'remaining_seconds' => max(0, (int) now()->diffInSeconds($result->expires_at, false)),
                'questions'         => StudentQuestionResource::collection($questions),
                'answers'           => $answers,
            ],
        ]);
    }

    // PUT: Autosave jawaban
    public function saveAnswer(ExamAnswerRequest $request, $resultId) {
        $student = $this->attemptService->currentStudent();
        $result = $this->attemptService->findOwnedResult($student, $resultId);
        $data = $request->validated();

        $this->attemptService->saveAnswer($result, $data['question_id'], $data['answer'] ?? null);

        return response()->json(['success' => true, 'message' => 'Jawaban tersimpan.']);
    }

    // POST: Kumpulkan ujian
    public function submit($resultId) {
        $student = $this->attemptService->currentStudent();
        $result = $this->attemptService->findOwnedResult($student, $resultId);

        $result = $this->attemptService->finalize($result);

        return response()->json([
            'success' => true,
            'message' => $result->status === 'GRADED'
                ? 'Ujian berhasil dikumpulkan.'
                : 'Ujian berhasil dikumpulkan. Nilai akan tampil setelah tentor menilai jawaban essay.',
            'data'    => ['result_id' => $result->id, 'status' => $result->status],
        ]);
    }
}
