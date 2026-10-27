<?php
namespace App\Http\Controllers\Api\StudentPortal;

use App\Http\Controllers\Controller;
use App\Http\Requests\Academic\ProgressReportRequest;
use App\Models\Admin\Student;
use App\Services\Academic\ProgressReportService;
use Illuminate\Support\Facades\Auth;

/**
 * Rapor milik siswa sendiri: hanya rapor yang sudah diterbitkan Admin.
 */
class StudentProgressReportController extends Controller {

    public function __construct(protected ProgressReportService $service) {}

    public function reports() {
        [$academicYear, $term] = ProgressReportService::currentTerm();

        return response()->json([
            'success'      => true,
            'data'         => $this->service->publishedFor([$this->student()->id]),
            'current_term' => ['academic_year' => $academicYear, 'term' => $term],
        ]);
    }

    public function showReport($id) {
        return response()->json(['success' => true, 'data' => $this->service->findPublishedFor([$this->student()->id], $id)]);
    }

    public function semester(ProgressReportRequest $request) {
        return response()->json([
            'success' => true,
            'data'    => $this->service->semesterList((int) $request->academic_year, $request->term, ['student_ids' => [$this->student()->id]]),
            'label'   => ProgressReportService::termLabel((int) $request->academic_year, $request->term),
        ]);
    }

    public function semesterShow(ProgressReportRequest $request) {
        $data = $this->service->semesterDetail($this->student()->id, $request->class_id, (int) $request->academic_year, $request->term);
        abort_unless($data, 404, 'Belum ada rapor terbit pada semester ini.');

        return response()->json(['success' => true, 'data' => $data]);
    }

    private function student(): Student {
        $student = Student::where('user_id', Auth::id())->first();
        abort_unless($student, 403, 'Akun ini tidak terhubung dengan data siswa.');
        return $student;
    }
}
