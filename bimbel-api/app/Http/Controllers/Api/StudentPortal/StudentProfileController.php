<?php
namespace App\Http\Controllers\Api\StudentPortal;

use App\Http\Controllers\Controller;
use App\Http\Requests\Account\UpdatePasswordRequest;
use App\Services\Account\PasswordService;
use App\Services\StudentPortal\StudentLearningService;
use Illuminate\Support\Facades\Auth;

/**
 * Profil siswa (data diubah Admin) & ganti password sendiri.
 */
class StudentProfileController extends Controller {

    public function __construct(protected StudentLearningService $learning) {}

    public function show() {
        $student = $this->learning->currentStudent()->load(['user', 'parents.user', 'classes.package', 'educationLevel']);

        return response()->json([
            'success' => true,
            'data'    => [
                'name'            => $student->full_name,
                'nis'             => $student->nis,
                'email'           => $student->user?->email,
                'phone'           => $student->user?->phone,
                'gender'          => $student->gender,
                'birth_date'      => $student->birth_date,
                'school_name'     => $student->school_name,
                'education_level' => $student->educationLevel?->display_name ?? trim("{$student->education_level} {$student->grade}"),
                'classes'         => $student->classes->map(fn($c) => [
                    'id' => $c->id, 'name' => $c->name, 'class_type' => $c->class_type, 'package_name' => $c->package?->package_name,
                ])->values(),
                'parents'         => $student->parents->map(fn($p) => [
                    'name' => $p->full_name, 'relationship' => $p->relationship, 'phone' => $p->user?->phone,
                ])->values(),
            ],
        ]);
    }

    public function updatePassword(UpdatePasswordRequest $request, PasswordService $passwords) {
        $passwords->change(Auth::user(), $request->password);

        return response()->json(['success' => true, 'message' => 'Password diperbarui. Sesi di perangkat lain telah dikeluarkan.']);
    }
}
