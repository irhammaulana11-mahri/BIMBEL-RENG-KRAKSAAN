<?php

namespace App\Services\Student;

use App\Models\Admin\Student;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use App\Models\Admin\ParentModel;
use App\Services\Student\StudentRegistrationService;

class StudentService
{
    public function __construct(
        protected StudentRegistrationService $registrationService
    ) {}
    /**
     * Daftar siswa dengan search, filter, dan pagination.
     */
    public function getStudents(Request $request): LengthAwarePaginator
    {
        $search = Str::lower(trim($request->input('search', '')));
        $status = Str::lower(trim($request->input('status', '')));
        $educationLevel = Str::lower(trim($request->input('education_level', '')));

        return Student::query()
            ->with([
                'user',
                'parents.user',
            ])

            // Search nama siswa / akun user / nama wali
            ->when($search !== '', function ($query) use ($search) {

                $query->where(function ($q) use ($search) {

                    // PostgreSQL → ILIKE
                    $q->where('full_name', 'ILIKE', "%{$search}%")

                        ->orWhereHas('user', function ($user) use ($search) {
                            $user->where('name', 'ILIKE', "%{$search}%");
                        })

                        ->orWhereHas('parents', function ($parent) use ($search) {
                            $parent->where('full_name', 'ILIKE', "%{$search}%");
                        });

                });

            })

            // Filter Status
            ->when($status !== '', function ($query) use ($status) {

                $query->where(
                    'is_active',
                    $status === 'aktif'
                );

            })

            // Filter Jenjang
            ->when($educationLevel !== '', function ($query) use ($educationLevel) {

                $query->where(
                    'education_level',
                    'ILIKE',
                    $educationLevel
                );

            })

            ->orderBy('nis')
            ->paginate(10);
    }

    /**
     * Detail siswa.
     */
    public function getStudent(Student $student): Student
    {
        return $student->load([
            'user',
            'parents.user',
        ]);
    }

    /**
     * Membuat data siswa.
     *
     * Tahap berikutnya method ini akan menggunakan
     * StudentRegistrationService.
     */
    public function create(array $data): Student
    {
        $parent = ParentModel::findOrFail(
            $data['parent_id']
        );

        return $this->registrationService
            ->register(
                $parent,
                $data
            );
    }

    /**
     * Update data siswa.
     */
    public function update(Student $student, array $data): Student
    {
        $student->update($data);

        return $student->fresh()->load([
            'user',
            'parents.user',
        ]);
    }

    /**
     * Hapus siswa.
     */
    public function delete(Student $student): bool
    {
        return (bool) $student->delete();
    }
}