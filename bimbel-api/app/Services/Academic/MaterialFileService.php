<?php
namespace App\Services\Academic;

use App\Models\Academic\ClassRoom;
use App\Models\Academic\ClassStudent;
use App\Models\Academic\Material;
use App\Models\Admin\Student;
use App\Models\Admin\Tentor;
use App\Models\Admin\User;
use App\Services\Tentor\TentorPortalService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * Berkas materi disimpan di disk privat (storage/app/private/materials) dan hanya
 * dapat dibuka lewat endpoint ber-otorisasi. Path lama "/storage/..." (disk publik) tetap dibaca.
 */
class MaterialFileService {

    public const DISK = 'local';
    public const FOLDER = 'materials';
    public const LEGACY_PREFIX = '/storage/';

    public function __construct(protected TentorPortalService $tentorPortal) {}

    public function store(UploadedFile $file): string {
        return $file->store(self::FOLDER, self::DISK);
    }

    public static function isExternal(?string $path): bool {
        return $path !== null && Str::startsWith($path, ['http://', 'https://']);
    }

    // [disk, path relatif] untuk file_path tersimpan
    public static function locate(?string $path): ?array {
        if (!$path || self::isExternal($path)) return null;
        if (Str::startsWith($path, self::LEGACY_PREFIX)) {
            return ['public', Str::after($path, self::LEGACY_PREFIX)];
        }
        return [self::DISK, ltrim($path, '/')];
    }

    public static function delete(?string $path): void {
        $location = self::locate($path);
        if ($location && Storage::disk($location[0])->exists($location[1])) {
            Storage::disk($location[0])->delete($location[1]);
        }
    }

    /**
     * Admin: semua. Tentor: mapel yang dikuasai/diajar. Siswa: materi aktif mapel kelasnya.
     */
    public function canAccess(User $user, Material $material): bool {
        $role = $user->role?->role_name;
        if (in_array($role, ['admin', 'super_admin'], true)) return true;

        $material->loadMissing('curriculum');
        $subjectId = $material->curriculum?->subject_id;
        if (!$subjectId) return false;

        if ($role === 'tentor') {
            $tentor = Tentor::with('subjects')->where('user_id', $user->id)->first();
            if (!$tentor) return false;
            $teaching = $this->tentorPortal->teachingMap($tentor)->flatten();
            return $tentor->subjects->contains('id', $subjectId) || $teaching->contains($subjectId);
        }

        if ($role === 'siswa') {
            if (!$material->is_active || !$material->curriculum->is_active) return false;
            $student = Student::where('user_id', $user->id)->first();
            if (!$student) return false;

            $classIds = ClassStudent::where('student_id', $student->id)->pluck('class_id');
            $classes = ClassRoom::whereIn('id', $classIds)->with('classSubjects')->get();
            if (!$classes->flatMap(fn($c) => $c->classSubjects->pluck('subject_id'))->contains($subjectId)) return false;

            // Kurikulum khusus jenjang hanya untuk jenjang kelas/siswa yang sesuai
            $levelId = $material->curriculum->education_level_id;
            return !$levelId || $classes->pluck('education_level_id')->push($student->education_level_id)->contains($levelId);
        }

        return false;
    }

    public function stream(Material $material) {
        $location = self::locate($material->file_path);
        abort_unless($location && Storage::disk($location[0])->exists($location[1]), 404, 'Berkas materi tidak ditemukan.');

        [$disk, $path] = $location;
        $fullPath = Storage::disk($disk)->path($path);
        $extension = pathinfo($path, PATHINFO_EXTENSION);
        $filename = Str::slug($material->title ?: 'materi') . ($extension ? ".{$extension}" : '');

        return response()->file($fullPath, [
            'Content-Type'           => Storage::disk($disk)->mimeType($path) ?: 'application/octet-stream',
            'Content-Disposition'    => 'inline; filename="' . $filename . '"',
            'Cache-Control'          => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma'                 => 'no-cache',
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
