<?php

namespace App\Http\Controllers\Api\Admin;

use App\Support\SafeDelete;
use App\Http\Controllers\Controller;
use App\Models\Admin\Role;
use App\Models\Admin\User;
use App\Services\Admin\MasterOverviewService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use App\Services\Student\FamilyAddressService;
use App\Models\Admin\Student;
use App\Models\Admin\ParentController;
use App\Services\Student\StudentService;
use App\Http\Requests\Admin\StudentRequest;
use App\Http\Resources\Admin\StudentResource;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;



class StudentController extends Controller
{
    public function __construct(
        protected StudentService $studentService
    ) {}

    public function index(Request $request) {
        $query = Student::query()
            ->with(['user','parents.user',]);
        
         // | Keyword Search
        if ($request->filled('keyword')) {
            $keyword = trim($request->keyword);
            $query->where(function (Builder $q) use ($keyword) {
                $q->where('full_name', 'ILIKE', "%{$keyword}%")
                    ->orWhere('nis', 'ILIKE', "%{$keyword}%")
                    ->orWhereHas('parents', function ($parent) use ($keyword) {
                        $parent->where('full_name', 'ILIKE', "%{$keyword}%");
                    });
            });

        }

        if ($request->filled('status')) {
            $status = filter_var($request->status, FILTER_VALIDATE_BOOLEAN);
            $query->where('is_active', $status);
        }


        if ($request->filled('education_level')) {
            $query->where('education_level', $request->education_level);
        }

        // | Pagination
        $perPage = $request->integer('per_page', 10);

        $students = $query
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
     

        return StudentResource::collection($students);
    }


    public function show(Student $student) {
        return new StudentResource($student->load(['user','parents.user','educationLevel']));
    }


    public function store(StudentRequest $request)
    {
        $student = $this->studentService->create(
            $request->validated()
        );

        return new StudentResource(
            $student->load([
                'user',
                'parents.user',
            ])
        );
    }


    public function update(StudentRequest $request, Student $student, FamilyAddressService $family) {
        $student->update($request->validated());
        if ($student->wasChanged(['home_address', 'home_latitude', 'home_longitude'])) $family->syncFromStudent($student);
        return new StudentResource(
            $student->fresh()->load(['user','parents.user',])
        );
    }


    // GET: Data drawer detail siswa (wali, kelas, jadwal, kehadiran, nilai, tagihan, akun)
    public function overview(Student $student, MasterOverviewService $overview) {
        return response()->json(['data' => $overview->student($student)]);
    }

    // POST: Buat akun login siswa; password kosong = dibuatkan sementara
    public function createAccount(Request $request, Student $student) {
        $data = $request->validate([
            'email'    => ['required', 'email', 'max:100', Rule::unique(User::class, 'email')],
            'password' => ['nullable', 'string', 'min:8'],
        ], [
            'email.required' => 'Email login wajib diisi.',
            'email.unique'   => 'Email sudah dipakai akun lain.',
            'password.min'   => 'Password minimal 8 karakter.',
        ]);
        if ($student->user_id) {
            throw ValidationException::withMessages(['email' => 'Siswa ini sudah memiliki akun login.']);
        }

        $password = $data['password'] ?? Str::password(10, symbols: false);
        DB::transaction(function () use ($student, $data, $password) {
            $user = User::create([
                'role_id'   => Role::where('role_name', 'siswa')->value('id'),
                'name'      => $student->full_name,
                'email'     => $data['email'],
                'password'  => Hash::make($password),
                'is_active' => true,
            ]);
            $student->forceFill(['user_id' => $user->id])->save();
        });

        return response()->json([
            'message'            => 'Akun login siswa dibuat.',
            'temporary_password' => empty($data['password']) ? $password : null,
        ], 201);
    }

    public function toggleStatus(Student $student) {
        $student->update([
            'is_active' => !$student->is_active
        ]);

        return response()->json([
            'success'   => true,
            'message'   => 'Status keaktifan siswa berhasil diubah.',
            'is_active' => $student->is_active,
            'data'      => new StudentResource($student->load(['user', 'parents.user', 'educationLevel']))
        ]);
    }
    

    // Akun login siswa ikut dihapus; siswa dengan riwayat belajar/keuangan cukup dinonaktifkan
    public function destroy(Student $student) {
        SafeDelete::run(function () use ($student) {
            $user = $student->user;
            $student->delete();
            $user?->delete();
        }, 'Siswa sudah memiliki riwayat absensi, ujian, rapor, atau tagihan sehingga tidak dapat dihapus. Nonaktifkan siswa sebagai gantinya.');

        return response()->json(['message' => 'Data siswa berhasil dihapus.']);
    }
}
