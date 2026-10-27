<?php
namespace App\Http\Controllers\Api\ParentPortal;

use App\Http\Controllers\Controller;
use App\Http\Requests\Academic\ProgressReportRequest;
use App\Models\Admin\ParentModel;
use App\Services\Academic\ProgressReportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Rapor anak untuk orang tua: hanya rapor yang sudah diterbitkan Admin.
 */
class ParentProgressReportController extends Controller {

    public function __construct(protected ProgressReportService $service) {}

    public function reports(Request $request) {
        $ids = $this->childIds();
        if ($request->filled('student_id')) {
            $ids = array_values(array_intersect($ids, [$request->student_id]));
        }
        [$academicYear, $term] = ProgressReportService::currentTerm();

        return response()->json([
            'success'      => true,
            'data'         => $this->service->publishedFor($ids),
            'children'     => $this->parent()->students()->get(['master.students.id', 'full_name'])->map(fn($s) => ['id' => $s->id, 'name' => $s->full_name]),
            'current_term' => ['academic_year' => $academicYear, 'term' => $term],
        ]);
    }

    public function showReport($id) {
        return response()->json(['success' => true, 'data' => $this->service->findPublishedFor($this->childIds(), $id)]);
    }

    public function semester(ProgressReportRequest $request) {
        $ids = $this->childIds();
        if ($request->filled('student_id')) {
            $ids = array_values(array_intersect($ids, [$request->student_id]));
        }

        return response()->json([
            'success' => true,
            'data'    => $this->service->semesterList((int) $request->academic_year, $request->term, ['student_ids' => $ids]),
            'label'   => ProgressReportService::termLabel((int) $request->academic_year, $request->term),
        ]);
    }

    public function semesterShow(ProgressReportRequest $request) {
        abort_unless(in_array($request->student_id, $this->childIds(), true), 404, 'Rapor tidak ditemukan.');
        $data = $this->service->semesterDetail($request->student_id, $request->class_id, (int) $request->academic_year, $request->term);
        abort_unless($data, 404, 'Belum ada rapor terbit pada semester ini.');

        return response()->json(['success' => true, 'data' => $data]);
    }

    private function parent(): ParentModel {
        $parent = ParentModel::where('user_id', Auth::id())->first();
        abort_unless($parent, 403, 'Akun ini tidak terhubung dengan data orang tua.');
        return $parent;
    }

    private function childIds(): array {
        return $this->parent()->students()->pluck('master.students.id')->all();
    }
}
