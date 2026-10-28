<?php
namespace App\Services\Student;

use App\Models\Admin\ParentModel;
use App\Models\Admin\Student;
use Illuminate\Support\Facades\DB;

/**
 * Alamat & titik rumah satu keluarga disimpan di orang tua (address, latitude, longitude)
 * dan di setiap anak (home_address, home_latitude, home_longitude). Perubahan di salah satu
 * sisi disalin ke sisi lain agar profil orang tua dan siswa tidak berbeda.
 * Update langsung via query supaya tidak memicu sinkron berulang.
 */
class FamilyAddressService {

    // Orang tua diubah (Admin / portal orang tua) -> semua anaknya ikut
    public function syncFromParent(ParentModel $parent): void {
        $studentIds = $parent->students()->pluck('master.students.id');
        if ($studentIds->isEmpty()) return;

        Student::whereIn('id', $studentIds)->update([
            'home_address'   => $parent->address,
            'home_latitude'  => $parent->latitude,
            'home_longitude' => $parent->longitude,
        ]);
    }

    // Rumah siswa diubah Admin -> orang tuanya dan saudara kandungnya ikut
    public function syncFromStudent(Student $student): void {
        $parentIds = $student->parents()->pluck('master.parents.id');
        if ($parentIds->isEmpty()) return;

        ParentModel::whereIn('id', $parentIds)->update([
            'address'   => $student->home_address,
            'latitude'  => $student->home_latitude,
            'longitude' => $student->home_longitude,
        ]);

        $siblingIds = DB::table('master.parent_students')->whereIn('parent_id', $parentIds)
            ->where('student_id', '!=', $student->id)->pluck('student_id');
        if ($siblingIds->isNotEmpty()) {
            Student::whereIn('id', $siblingIds)->update([
                'home_address'   => $student->home_address,
                'home_latitude'  => $student->home_latitude,
                'home_longitude' => $student->home_longitude,
            ]);
        }
    }

    // Anak baru tanpa alamat rumah memakai alamat orang tuanya
    public function inheritFromParent(Student $student, ParentModel $parent): void {
        if ($student->home_address || $student->home_latitude !== null) return;
        if (!$parent->address && $parent->latitude === null) return;

        Student::whereKey($student->id)->update([
            'home_address'   => $parent->address,
            'home_latitude'  => $parent->latitude,
            'home_longitude' => $parent->longitude,
        ]);
    }
}
