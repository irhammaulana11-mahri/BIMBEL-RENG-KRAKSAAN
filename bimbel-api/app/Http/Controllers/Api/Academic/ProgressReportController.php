<?php
namespace App\Http\Controllers\Api\Academic;

use App\Http\Controllers\Controller;
use App\Http\Requests\Academic\ProgressReportRequest;
use App\Models\Academic\ClassRoom;
use App\Models\Academic\ProgressReport;
use App\Models\Admin\Student;
use App\Services\Academic\ProgressReportService;

/**
 * Rapor perkembangan siswa (Admin): rekap bulanan, catatan umum, terbit/tarik, rekap semester.
 */
class ProgressReportController extends Controller {

    public function __construct(protected ProgressReportService $service) {}

    // GET: Daftar rapor satu bulan
    public function index(ProgressReportRequest $request) {
        [$year, $month] = $request->period();
        $result = $this->service->listForPeriod($year, $month, $request->only(['class_id', 'keyword', 'status']));

        return response()->json(['success' => true] + $result);
    }

    // GET: Detail rapor siswa (live bila draft, snapshot bila terbit)
    public function show(ProgressReportRequest $request) {
        [$year, $month] = $request->period();

        return response()->json([
            'success' => true,
            'data'    => $this->service->detail(
                Student::findOrFail($request->student_id),
                ClassRoom::findOrFail($request->class_id),
                $year, $month
            ),
        ]);
    }

    // PUT: Catatan umum Admin
    public function saveGeneralNote(ProgressReportRequest $request) {
        [$year, $month] = $request->period();
        $this->service->saveGeneralNote(
            Student::findOrFail($request->student_id),
            ClassRoom::findOrFail($request->class_id),
            $year, $month,
            $request->general_note
        );

        return response()->json(['success' => true, 'message' => 'Catatan umum disimpan.']);
    }

    // POST: Terbitkan rapor (satu, beberapa, atau seluruh siswa kelas)
    public function publish(ProgressReportRequest $request) {
        [$year, $month] = $request->period();
        $result = $this->service->publish(ClassRoom::findOrFail($request->class_id), $year, $month, $request->student_ids);

        $message = "{$result['published']} rapor diterbitkan.";
        if ($result['skipped'] > 0) $message .= " {$result['skipped']} rapor sudah terbit sebelumnya.";

        return response()->json(['success' => true, 'message' => $message, 'data' => $result]);
    }

    // POST: Tarik rapor ke draft
    public function unpublish(ProgressReport $report) {
        $this->service->unpublish($report);

        return response()->json(['success' => true, 'message' => 'Rapor ditarik ke draft. Orang tua tidak lagi dapat melihatnya.']);
    }

    // GET: Rekap semester (dari rapor terbit)
    public function semester(ProgressReportRequest $request) {
        $rows = $this->service->semesterList(
            (int) $request->academic_year,
            $request->term,
            $request->only(['class_id', 'keyword'])
        );

        return response()->json([
            'success' => true,
            'data'    => $rows,
            'label'   => ProgressReportService::termLabel((int) $request->academic_year, $request->term),
            'months'  => collect(ProgressReportService::termMonths((int) $request->academic_year, $request->term))
                            ->map(fn($p) => ['year' => $p[0], 'month' => $p[1], 'label' => ProgressReportService::periodLabel($p[0], $p[1])]),
        ]);
    }

    public function semesterShow(ProgressReportRequest $request) {
        $data = $this->service->semesterDetail($request->student_id, $request->class_id, (int) $request->academic_year, $request->term);
        abort_unless($data, 404, 'Belum ada rapor terbit pada semester ini.');

        return response()->json(['success' => true, 'data' => $data]);
    }
}
