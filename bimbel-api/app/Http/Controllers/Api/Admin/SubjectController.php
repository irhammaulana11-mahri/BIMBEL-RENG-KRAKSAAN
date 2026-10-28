<?php

namespace App\Http\Controllers\Api\Admin;

use App\Support\SafeDelete;
use App\Http\Controllers\Controller;
use App\Services\Admin\MasterOverviewService;
use App\Http\Requests\Admin\SubjectRequest;
use App\Http\Resources\Admin\SubjectResource;
use App\Models\Admin\User;
use App\Models\Admin\Subject;
use App\Models\Admin\Tentor;
use App\Models\Admin\TentorSubject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Builder;


class SubjectController extends Controller {
    
    public function statistics() {
        // Digunakan oleh Dashboard Card di React (Subject, Curriculum, Material, Exam)
        return response()->json([
            'total_subjects'    => DB::table('master.subjects')->count(),
            'total_curriculums' => DB::table('academic.curriculums')->count(), // Sesuaikan nama tabel Anda
            'total_materials'   => DB::table('academic.materials')->count(),
            'total_exams'       => DB::table('exam.exams')->count(),
        ]);
    }

    public function index(Request $request) {
        $query = Subject::query()
            ->with(['educationLevel'])
            ->withCount(['tentors', 'curriculums', 'materials', 'schedules', 'exams']);
        
        if ($request->filled('keyword')) {
            $keyword = trim($request->keyword);
            $query->where(function (Builder $q) use ($keyword) {
                $q->where('code', 'ILIKE', "%{$keyword}%")
                  ->orWhere('name', 'ILIKE', "%{$keyword}%");
            });
        }

        if ($request->filled('status')) {
            $status = filter_var($request->status, FILTER_VALIDATE_BOOLEAN);
            $query->where('is_active', $status);
        }

        if ($request->filled('education_level_id')) {
            $query->where('education_level_id', $request->education_level_id);
        }

        $perPage = $request->integer('per_page', 10);
        $subjects = $query->latest()->paginate($perPage)->withQueryString();
     
        return SubjectResource::collection($subjects);
    }

    public function show(Subject $subject) {
        return new SubjectResource(
            $subject->load([
                    'schedules.tentor.user',
                    'schedules.classroom',
                    'educationLevel', 
                    'curriculums'
                     => function($q) {
                            $q->orderBy('semester')->orderBy('order_no')->withCount('materials');
            }])
            ->loadCount(['tentors', 'curriculums', 'materials', 'schedules', 'exams'])
        );
    }

    public function store(SubjectRequest $request) {
        $subject = Subject::create($request->validated());
        return new SubjectResource($subject->load('educationLevel'));
    }

    public function update(SubjectRequest $request, Subject $subject) {
        $subject->update($request->validated());
        return new SubjectResource($subject->fresh('educationLevel'));
    }
    
    public function destroy(Subject $subject) {
        SafeDelete::run(fn() => $subject->delete(),
            'Mata pelajaran masih dipakai di kelas, jadwal, kurikulum, atau ujian sehingga tidak dapat dihapus. Nonaktifkan mapel sebagai gantinya.');
        return response()->json(['message' => 'Mata pelajaran berhasil dihapus.']);
    }

    // GET: Jadwal, ujian & statistik untuk drawer detail mapel
    public function overview(Subject $subject, MasterOverviewService $overview) {
        return response()->json(['data' => $overview->subject($subject)]);
    }

    public function toggleStatus(Subject $subject) {
        if ($subject->is_active) {
            // Cek apakah terpakai di jadwal/ujian aktif
            $schedulesCount = $subject->schedules()->count();
            if ($schedulesCount > 0) {
                return response()->json([
                    'message' => "Mata pelajaran tidak dapat dinonaktifkan karena terikat dengan {$schedulesCount} jadwal."
                ], 422);
            }
        }

        $subject->update(['is_active' => !$subject->is_active]);

        return response()->json([
            'message' => 'Status Mata Pelajaran berhasil diperbarui.',
            'is_active' => $subject->is_active
        ]);
    }

    // Optional: Method terpisah jika mau lazy-load jadwal
    public function schedules(Subject $subject) {
        $schedules = $subject->schedules()
            ->with(['tentor.user', 'classroom'])
            ->where('is_active', true)
            ->get();

        return response()->json(['data' => $schedules]);
    }
}
