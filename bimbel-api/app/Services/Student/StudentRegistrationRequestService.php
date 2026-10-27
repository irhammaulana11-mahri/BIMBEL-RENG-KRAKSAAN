<?php
namespace App\Services\Student;

use App\Models\Academic\ClassRoom;
use App\Models\Academic\ClassStudent;
use App\Models\Admin\EducationLevel;
use App\Models\Admin\ParentModel;
use App\Models\Admin\StudentRegistrationRequest;
use App\Support\LocalTime;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Pendaftaran anak baru oleh orang tua. Disetujui Admin -> data siswa dibuat,
 * ditautkan ke orang tua, dan (opsional) langsung ditempatkan di kelas.
 */
class StudentRegistrationRequestService {

    public const MAX_PENDING_PER_PARENT = 5;

    public function __construct(protected StudentRegistrationService $registrationService) {}

    public function submit(ParentModel $parent, array $data): StudentRegistrationRequest {
        $pending = StudentRegistrationRequest::where('parent_id', $parent->id)->where('status', 'PENDING')->count();
        if ($pending >= self::MAX_PENDING_PER_PARENT) {
            throw ValidationException::withMessages(['full_name' => 'Masih ada ' . $pending . ' pengajuan yang menunggu persetujuan Admin.']);
        }

        $duplicate = StudentRegistrationRequest::where('parent_id', $parent->id)
            ->where('status', 'PENDING')
            ->whereRaw('LOWER(full_name) = ?', [mb_strtolower(trim($data['full_name']))])
            ->exists();
        if ($duplicate) {
            throw ValidationException::withMessages(['full_name' => 'Pengajuan untuk anak dengan nama ini sedang diproses.']);
        }

        return StudentRegistrationRequest::create([
            'parent_id'          => $parent->id,
            'full_name'          => trim($data['full_name']),
            'gender'             => $data['gender'] ?? null,
            'birth_date'         => $data['birth_date'] ?? null,
            'school_name'        => $data['school_name'] ?? null,
            'education_level_id' => $data['education_level_id'] ?? null,
            'package_id'         => $data['package_id'] ?? null,
            'note'               => $data['note'] ?? null,
            'status'             => 'PENDING',
        ]);
    }

    public function cancel(StudentRegistrationRequest $request): StudentRegistrationRequest {
        return DB::transaction(function () use ($request) {
            $request = StudentRegistrationRequest::lockForUpdate()->findOrFail($request->id);
            $this->ensurePending($request);
            $request->update(['status' => 'CANCELLED']);
            return $request;
        });
    }

    /**
     * $data: class_id (opsional), review_note (opsional), full_name/school_name (koreksi Admin, opsional)
     */
    public function approve(StudentRegistrationRequest $request, array $data = []): StudentRegistrationRequest {
        return DB::transaction(function () use ($request, $data) {
            $request = StudentRegistrationRequest::lockForUpdate()->with('parent')->findOrFail($request->id);
            $this->ensurePending($request);

            $class = null;
            if (!empty($data['class_id'])) {
                $class = ClassRoom::lockForUpdate()->withCount('students')->findOrFail($data['class_id']);
                if (!$class->is_active) {
                    throw ValidationException::withMessages(['class_id' => 'Kelas tidak aktif.']);
                }
                if ($class->max_students && $class->students_count >= $class->max_students) {
                    throw ValidationException::withMessages(['class_id' => "Kelas {$class->name} sudah penuh ({$class->students_count}/{$class->max_students})."]);
                }
            }

            $level = $request->education_level_id ? EducationLevel::find($request->education_level_id) : null;

            $student = $this->registrationService->register($request->parent, [
                'full_name'       => trim($data['full_name'] ?? $request->full_name),
                'gender'          => $request->gender,
                'birth_date'      => $request->birth_date?->toDateString(),
                'school_name'     => $data['school_name'] ?? $request->school_name,
                'education_level' => $level?->education_level,
                'grade'           => $level?->grade_level,
            ]);
            $student->forceFill(['education_level_id' => $level?->id])->save();

            if ($class) {
                ClassStudent::create(['class_id' => $class->id, 'student_id' => $student->id]);
            }

            $request->update([
                'status'      => 'APPROVED',
                'student_id'  => $student->id,
                'class_id'    => $class?->id,
                'review_note' => $data['review_note'] ?? null,
                'reviewed_by' => Auth::id(),
                'reviewed_at' => now(),
            ]);

            return $request;
        });
    }

    public function reject(StudentRegistrationRequest $request, string $note): StudentRegistrationRequest {
        return DB::transaction(function () use ($request, $note) {
            $request = StudentRegistrationRequest::lockForUpdate()->findOrFail($request->id);
            $this->ensurePending($request);
            $request->update([
                'status'      => 'REJECTED',
                'review_note' => trim($note),
                'reviewed_by' => Auth::id(),
                'reviewed_at' => now(),
            ]);
            return $request;
        });
    }

    private function ensurePending(StudentRegistrationRequest $request): void {
        if ($request->status !== 'PENDING') {
            throw ValidationException::withMessages(['status' => 'Pengajuan ini sudah diproses.']);
        }
    }

    public static function relations(): array {
        return ['parent.user', 'educationLevel', 'package', 'student', 'classroom', 'reviewer'];
    }

    public static function present(StudentRegistrationRequest $r): array {
        return [
            'id'              => $r->id,
            'status'          => $r->status,
            'full_name'       => $r->full_name,
            'gender'          => $r->gender,
            'birth_date'      => $r->birth_date?->toDateString(),
            'school_name'     => $r->school_name,
            'education_level' => $r->educationLevel ? ['id' => $r->educationLevel->id, 'name' => $r->educationLevel->display_name, 'level' => $r->educationLevel->education_level] : null,
            'package'         => $r->package ? ['id' => $r->package->id, 'name' => $r->package->package_name, 'class_type' => $r->package->class_type, 'price' => (float) $r->package->default_price] : null,
            'note'            => $r->note,
            'parent'          => $r->parent ? ['id' => $r->parent->id, 'name' => $r->parent->full_name, 'phone' => $r->parent->user?->phone, 'email' => $r->parent->user?->email] : null,
            'student'         => $r->student ? ['id' => $r->student->id, 'name' => $r->student->full_name, 'nis' => $r->student->nis] : null,
            'class_name'      => $r->classroom?->name,
            'review_note'     => $r->review_note,
            'reviewer_name'   => $r->reviewer?->name,
            'reviewed_at'     => LocalTime::format($r->reviewed_at, 'Y-m-d H:i'),
            'created_at'      => LocalTime::format($r->created_at, 'Y-m-d H:i'),
        ];
    }
}
