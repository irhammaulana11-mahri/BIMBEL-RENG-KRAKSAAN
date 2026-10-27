<?php

namespace App\Http\Controllers\Api\Academic;

use App\Support\SafeDelete;
use App\Http\Controllers\Controller;
use App\Http\Requests\Academic\ClassRequest;
use App\Http\Requests\Academic\ClassSubjectRequest;
use App\Http\Requests\Academic\ClassTentorRequest;
use App\Http\Requests\Academic\ClassStudentRequest;
use App\Http\Requests\Academic\ClassStatusRequest;
use App\Http\Resources\Academic\ClassResource;
use App\Models\Academic\ClassRoom;
use App\Models\Academic\ClassSubject;
use App\Models\Admin\Subject;
use App\Models\Admin\Tentor;
use App\Models\Admin\Student;
use App\Models\Admin\ParentModel;
use App\Models\Admin\EducationLevel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Builder;

class ClassController extends Controller 
{
    public function summary() {
        $total   = ClassRoom::count();
        $reguler = ClassRoom::whereIn('class_type', ['REGULER', 'reguler', 'bimbel'])->count();
        $private = ClassRoom::whereIn('class_type', ['PRIVATE', 'private', 'rumah'])->count();
        $online  = ClassRoom::whereIn('class_type', ['ONLINE', 'online'])->count();

        return response()->json([
            'success' => true,
            'data' => compact('total', 'reguler', 'private', 'online')
        ]);
    }

    public function index(Request $request) {
        $query = ClassRoom::query()
            ->with(['location', 'package', 'educationLevel','classSubjects.subject', 'classSubjects.tentor.user', 'students.user'])
            ->withCount(['students', 'schedules']);

        if ($request->filled('keyword')) {
            $keyword = trim($request->keyword);
            $query->where(function (Builder $q) use ($keyword) {
                $q->where('code', 'ILIKE', "%{$keyword}%")
                  ->orWhere('name', 'ILIKE', "%{$keyword}%")
                  ->orWhere('education_level', 'ILIKE', "%{$keyword}%");
            });
        }

        if ($request->filled('status_active')) {
            $query->where('is_active', filter_var($request->status_active, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('class_type')) {
            $query->where('class_type', 'ILIKE', $request->class_type);
        }

        if ($request->filled('education_level')) {
            $query->where('education_level', $request->education_level);
        }

        // Frontend mengirim per_page; perPage tetap diterima untuk kompatibilitas
        $perPage = min(max($request->integer('per_page', $request->integer('perPage', 10)), 1), 200);
        $classes = $query->latest()->paginate($perPage)->withQueryString();

        return ClassResource::collection($classes);
    }

    public function getSubjectsForClass(Request $request) {
        $educationLevelId = $request->input('education_level_id');

        $query = Subject::query()->where('is_active', true);

        if (!empty($educationLevelId)) {
            $query->where(function($q) use ($educationLevelId) {
                if (!empty($educationLevelId)) {
                    $q->where('education_level_id', $educationLevelId);
                }
            });
        }

        $subjects = $query->get()->map(fn($s) => [
            'id'                 => (string) $s->id,
            'code'               => $s->code ?? 'MAPEL',
            'name'               => $s->name,
            'education_level_id' => $s->education_level_id,
        ]);

        return response()->json([
            'success' => true,
            'data'    => $subjects
        ]);
    }

    public function getTentorsForClass(Request $request) {
        $educationLevelId = $request->input('education_level_id');
        
        $subjectIds = $request->input('subject_ids', []);
        if (is_string($subjectIds)) {
            $subjectIds = explode(',', $subjectIds);
        }
        $subjectIds = array_filter($subjectIds);

        $query = Tentor::query()
            ->where('is_active', true)
            ->with(['user', 'subjects']);

        // 🟢 Filter Tentor berdasarkan subject_ids DAN education_level_id pada tabel subjects
        if (!empty($subjectIds) || !empty($educationLevelId)) {
            $query->whereHas('subjects', function($q) use ($subjectIds, $educationLevelId) {
                // Pastikan merujuk ke nama tabel 'subjects' secara eksplisit
                if (!empty($subjectIds)) {
                    $q->whereIn('subjects.id', $subjectIds);
                }
                
                if (!empty($educationLevelId)) {
                    $q->where('subjects.education_level_id', $educationLevelId);
                }
            });
        }

        $tentors = $query->get()->map(function($t) {
            $subjectNames = $t->subjects->pluck('name')->toArray();

            return [
                'id'              => $t->id,
                'name'            => $t->user?->name ?? $t->full_name,
                'code'            => $t->code ?? $t->education,
                'display_name'    => $t->education_level?->display_name,
                'subject_names'   => $subjectNames,
                'subjects'        => $t->subjects->map(fn($s) => [
                    'id'                 => $s->id, 
                    'name'               => $s->name,
                    'education_level_id' => $s->education_level_id
                ]),
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $tentors
        ]);
    }

    public function getStudentsForClass(Request $request) {
        $educationLevel   = $request->input('education_level');
        $educationLevelId = $request->input('education_level_id');
        $keyword          = $request->input('keyword');

        $query = Student::query()
            ->where('is_active', true)
            ->with(['user', 'educationLevel','parents']);

        // 🟢 Kembalikan logika OR agar siswa dengan format lama (tanpa UUID) tetap terbaca
        if (!empty($educationLevel) || !empty($educationLevelId)) {
            $query->where(function($q) use ($educationLevel, $educationLevelId) {
                if (!empty($educationLevelId)) {
                    $q->where('education_level_id', $educationLevelId);
                }
                if (!empty($educationLevel)) {
                    $q->orWhere('education_level', 'ILIKE', "%{$educationLevel}%");
                }
            });
        }

        if (!empty($keyword)) {
            $query->where(function($q) use ($keyword) {
                $q->where('full_name', 'ILIKE', "%{$keyword}%")
                  ->orWhere('nis', 'ILIKE', "%{$keyword}%")
                  ->orWhere('school_name', 'ILIKE', "%{$keyword}%");
            });
        }

        $students = $query->latest()->get()->map(function($st) {
            return [
                'id'                 => $st->id,
                'full_name'          => $st->full_name ?? $st->user?->name ?? 'Siswa',
                'name'               => $st->full_name ?? $st->user?->name ?? 'Siswa',
                'nis'                => $st->nis ?? 'STD-',
                'school_name'        => $st->school_name ?? '-',
                'grade'              => $st->grade ?? '-',
                'education_level'    => $st->education_level ?? 'SD',
                'education_level_id' => $st->education_level_id,
                'display_grade'      => $st->educationLevel?->display_name ?? $st->grade ?? $st->education_level ?? 'SD',
                'parent_name'       => $st->parents?->first()?->full_name ?? '-',
                'address'           => $st->parents?->first()?->address ?? $st->address ?? '-',
            ];
        });

        return response()->json([
            'success' => true,
            'data'    => $students
        ]);
    }

    public function unscheduled(Request $request) {
        $query = ClassRoom::query() // Sesuaikan dengan nama Model Kelas Anda
            ->where('is_active', true)
            // 🟢 INI KUNCI FILTERNYA: Hanya ambil kelas yang belum punya relasi schedule
            ->whereDoesntHave('schedules') 
            ->with([
                'location', 
                'package', 
                'educationLevel',
                'classSubjects.subject', 
                'classSubjects.tentor.user', 
            ])
            ->withCount(['students', 'schedules', 'classSubjects']);

        // Tambahkan pencarian jika diperlukan dari frontend
        if ($request->filled('keyword')) {
            $keyword = strtolower($request->keyword);
            $query->where('name', 'ILIKE', "%{$keyword}%")
                  ->orWhere('code', 'ILIKE', "%{$keyword}%");
        }

        $classes = $query->latest()->get();

        // Gunakan ClassResource yang sudah ada agar format JSON konsisten dengan Frontend
        return \App\Http\Resources\Academic\ClassResource::collection($classes);
    }

    public function store(ClassRequest $request) {
        DB::beginTransaction();
        try {
            $data = $request->validated();
            $class = ClassRoom::create($data);

            if (!empty($data['subjects'])) {
                foreach ($data['subjects'] as $index => $sub) {
                    ClassSubject::create([
                        'class_id'           => $class->id,
                        'package_subject_id' => $sub['package_subject_id'] ?? $class->package_id,
                        'subject_id'         => $sub['subject_id'],
                        'tentor_id'          => $sub['tentor_id'] ?? null,
                        'meeting_target'     => $sub['meeting_target'] ?? $data['meeting_per_month'] ?? 16,
                        'display_order'      => $sub['display_order'] ?? ($index + 1),
                        'status'             => 'ACTIVE',
                    ]);
                }
            }

            if (!empty($data['student_ids'])) {
                $class->students()->sync($data['student_ids']);
            }

            DB::commit();

            return new ClassResource(
                $class->load(['location', 'package', 'classSubjects.subject', 'classSubjects.tentor.user', 'students.user'])
                    ->loadCount(['students', 'schedules'])
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function show(ClassRoom $class) {
        return new ClassResource(
            $class->load(['location', 'package', 'classSubjects.subject', 'classSubjects.tentor.user', 'students.user', 'schedules.subject'])
                  ->loadCount(['students', 'schedules'])
        );
    }

    public function update(ClassRequest $request, ClassRoom $class) {
        DB::beginTransaction();
        try {
            $data = $request->validated();
            $class->update($data);

            if (isset($data['subjects'])) {
                ClassSubject::where('class_id', $class->id)->delete();
                
                foreach ($data['subjects'] as $index => $sub) {
                    ClassSubject::create([
                        'class_id'           => $class->id,
                        'package_subject_id' => $sub['package_subject_id'] ?? $class->package_id,
                        'subject_id'         => $sub['subject_id'],
                        'tentor_id'          => $sub['tentor_id'] ?? null,
                        'meeting_target'     => $sub['meeting_target'] ?? $class->meeting_per_month ?? 16,
                        'display_order'      => $sub['display_order'] ?? ($index + 1),
                        'status'             => 'ACTIVE',
                    ]);
                }
            }

            if (isset($data['student_ids'])) {
                $class->students()->sync($data['student_ids']);
            }

            DB::commit();

            return new ClassResource(
                $class->fresh()->load(['location', 'package', 'classSubjects.subject', 'classSubjects.tentor.user', 'students.user'])
                    ->loadCount(['students', 'schedules'])
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function updateSubjects(ClassSubjectRequest $request, ClassRoom $class) {
        DB::beginTransaction();
        try {
            ClassSubject::where('class_id', $class->id)->delete();

            foreach ($request->validated()['subjects'] as $index => $sub) {
                ClassSubject::create([
                    'class_id'           => $class->id,
                    'package_subject_id' => $sub['package_subject_id'] ?? $class->package_id,
                    'subject_id'         => $sub['subject_id'],
                    'tentor_id'          => $sub['tentor_id'] ?? null,
                    'meeting_target'     => $sub['meeting_target'] ?? $class->meeting_per_month ?? 16,
                    'display_order'      => $sub['display_order'] ?? ($index + 1),
                    'status'             => 'ACTIVE',
                ]);
            }

            DB::commit();

            return new ClassResource(
                $class->fresh()->load(['location', 'package', 'classSubjects.subject', 'classSubjects.tentor.user', 'students.user'])
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function updateTentors(ClassTentorRequest $request, ClassRoom $class) {
        DB::beginTransaction();
        try {
            foreach ($request->validated()['assignments'] as $item) {
                ClassSubject::where('class_id', $class->id)
                    ->where('subject_id', $item['subject_id'])
                    ->update(['tentor_id' => $item['tentor_id'] ?? null]);
            }

            DB::commit();

            return new ClassResource(
                $class->fresh()->load(['location', 'package', 'classSubjects.subject', 'classSubjects.tentor.user', 'students.user'])
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function syncStudents(ClassStudentRequest $request, ClassRoom $class) {
        $data = $request->validated();
        $class->students()->sync($data['student_ids'] ?? []);

        return new ClassResource(
            $class->fresh()->load(['location', 'package', 'classSubjects.subject', 'classSubjects.tentor.user', 'students.user'])
        );
    }

    public function toggleStatus(ClassRoom $class) {
        $class->update(['is_active' => !$class->is_active]);

        return response()->json([
            'success'   => true,
            'message'   => 'Status keaktifan kelas berhasil diubah.',
            'is_active' => $class->is_active,
        ]);
    }

    public function updateProgressStatus(ClassStatusRequest $request, ClassRoom $class) {
        $data = $request->validated();
        $class->update(['status' => $data['status']]);

        return response()->json([
            'success' => true,
            'message' => 'Status progress kelas berhasil diperbarui.',
            'status'  => $class->status
        ]);
    }

    public function duplicate(ClassRoom $class) {
        DB::beginTransaction();
        try {
            $newClass = $class->replicate(['code']);
            $newClass->code = $class->code . '-COPY';
            $newClass->name = $class->name . ' (Salinan)';
            $newClass->save();

            foreach ($class->classSubjects as $cs) {
                ClassSubject::create([
                    'class_id'           => $newClass->id,
                    'package_subject_id' => $cs->package_subject_id,
                    'subject_id'         => $cs->subject_id,
                    'tentor_id'          => $cs->tentor_id,
                    'meeting_target'     => $cs->meeting_target,
                    'display_order'      => $cs->display_order,
                    'status'             => 'ACTIVE',
                ]);
            }

            DB::commit();

            return new ClassResource(
                $newClass->load(['location', 'package', 'classSubjects.subject', 'classSubjects.tentor.user'])
                         ->loadCount(['students', 'schedules'])
            );
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function destroy(ClassRoom $class) {
        SafeDelete::run(function () use ($class) {
            $class->classSubjects()->delete();
            $class->students()->detach();
            $class->delete();
        }, 'Kelas sudah memiliki jadwal, tagihan, atau rapor sehingga tidak dapat dihapus. Nonaktifkan kelas atau ubah statusnya menjadi selesai.');

        return response()->json([
            'success' => true,
            'message' => 'Kelas berhasil dihapus.'
        ]);
    }
}