<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\EducationLevel;
use App\Http\Requests\Admin\EducationLevelRequest;
use App\Http\Resources\Admin\EducationLevelResource;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;

class EducationLevelController extends Controller {
    public function index(Request $request) {
        $query = EducationLevel::query()
            ->withCount(['subjects', 'classes']); // Tambahkan 'packages' jika ada

        if ($request->filled('keyword')) {
            $keyword = trim($request->keyword);
            $query->where(function (Builder $q) use ($keyword) {
                $q->where('level_code', 'ILIKE', "%{$keyword}%")
                  ->orWhere('display_name', 'ILIKE', "%{$keyword}%")
                  ->orWhere('education_level', 'ILIKE', "%{$keyword}%");
            });
        }

        // | Status
        if ($request->filled('status')) {
            $status = filter_var($request->status, FILTER_VALIDATE_BOOLEAN);
            $query->where('is_active', $status);
        }


        $query->orderBy('sort_order', 'asc')
                ->orderBy('grade_level', 'asc');

        $perPage = $request->integer('per_page', 10);
        $data = $query->paginate($perPage)->withQueryString();

        return EducationLevelResource::collection($data);
    }

    public function store(EducationLevelRequest $request) {
        $level = EducationLevel::create($request->validated());
        return new EducationLevelResource($level);
    }

    public function update(EducationLevelRequest $request, EducationLevel $educationLevel) {
        $educationLevel->update($request->validated());
        return new EducationLevelResource($educationLevel);
    }

    public function toggleStatus(EducationLevel $educationLevel) {
        // Validasi Backend: Jika mau dinonaktifkan (is_active saat ini true), cek apakah terpakai
        if ($educationLevel->is_active) {
            $educationLevel->loadCount(['subjects', 'classes']); // Tambah 'packages'
            
            $subjCount = $educationLevel->subjects_count;
            $classCount = $educationLevel->classes_count;
            $packCount = $educationLevel->packages_count ?? 0;

            if ($subjCount > 0 || $classCount > 0 || $packCount > 0) {
                return response()->json([
                    'message' => "Education Level ini masih digunakan oleh {$subjCount} Subject, {$packCount} Package, dan {$classCount} Class. Tidak dapat dinonaktifkan."
                ], 422);
            }
        }

        // Jika lolos, balik statusnya
        $educationLevel->update(['is_active' => !$educationLevel->is_active]);

        return response()->json([
            'message' => 'Status berhasil diperbarui.',
            'is_active' => $educationLevel->is_active
        ]);
    }
}