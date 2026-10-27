<?php
namespace App\Http\Controllers\Api\TentorPortal;

use App\Http\Controllers\Controller;
use App\Http\Requests\Academic\ProgressReportRequest;
use App\Models\Admin\Tentor;
use App\Services\Academic\ProgressReportService;
use Illuminate\Support\Facades\Auth;

/**
 * Catatan perkembangan siswa per mapel yang diajar tentor (bahan rapor bulanan).
 */
class TentorProgressNoteController extends Controller {

    public function __construct(protected ProgressReportService $service) {}

    // GET: Kelas-mapel yang diajar beserta rekap & catatan per siswa
    public function notes(ProgressReportRequest $request) {
        [$year, $month] = $request->period();

        return response()->json([
            'success' => true,
            'data'    => $this->service->notesForTentor($this->tentor(), $year, $month),
            'period'  => ['year' => $year, 'month' => $month, 'label' => ProgressReportService::periodLabel($year, $month)],
        ]);
    }

    // PUT: Simpan catatan satu kelas-mapel
    public function saveNotes(ProgressReportRequest $request) {
        [$year, $month] = $request->period();
        $saved = $this->service->saveTentorNotes(
            $this->tentor(), $request->class_id, $request->subject_id, $year, $month, $request->notes
        );

        return response()->json(['success' => true, 'message' => "Catatan disimpan ({$saved} siswa)."]);
    }

    private function tentor(): Tentor {
        $tentor = Tentor::where('user_id', Auth::id())->first();
        abort_unless($tentor, 403, 'Akun ini tidak terhubung dengan data tentor.');
        return $tentor;
    }
}
