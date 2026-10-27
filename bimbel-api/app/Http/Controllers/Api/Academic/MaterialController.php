<?php

namespace App\Http\Controllers\Api\Academic;

use App\Models\Academic\SessionActivity;
use App\Services\Academic\MaterialFileService;

use App\Http\Controllers\Controller;
use App\Models\Academic\Material;
use App\Http\Requests\Academic\MaterialRequest;
use App\Http\Resources\Academic\MaterialResource;
use Illuminate\Http\Request;

class MaterialController extends Controller {
    // Daftar materi: per kurikulum (menu Mapel) atau pustaka lintas mapel (menu Modul)
    public function index(Request $request) {
        $query = Material::query()
            ->with(['curriculum.subject.educationLevel', 'tentor.user'])
            ->withCount(['sessionActivities as usage_count']);

        if ($request->filled('curriculum_id')) {
            $query->where('curriculum_id', $request->curriculum_id);
        }

        if ($request->filled('subject_id')) {
            $query->whereHas('curriculum', fn($q) => $q->where('subject_id', $request->subject_id));
        }

        if ($request->filled('education_level_id')) {
            $query->whereHas('curriculum.subject', fn($q) => $q->where('education_level_id', $request->education_level_id));
        }

        if ($request->filled('material_type')) {
            $query->where('material_type', strtoupper($request->material_type));
        }

        if ($request->filled('status')) {
            $query->where('is_active', filter_var($request->status, FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('keyword')) {
            $keyword = '%' . trim($request->keyword) . '%';
            $query->where(fn($q) => $q->where('title', 'ILIKE', $keyword)
                ->orWhereHas('curriculum', fn($c) => $c->where('title', 'ILIKE', $keyword)));
        }

        // Pustaka diurutkan terbaru; per kurikulum mengikuti urutan materi
        $request->filled('curriculum_id')
            ? $query->orderBy('sort_order', 'asc')
            : $query->orderByDesc('created_at');

        $data = $query->paginate(min($request->integer('per_page', 15), 100))->withQueryString();

        return MaterialResource::collection($data)->additional([
            'summary' => [
                'total'    => Material::count(),
                'active'   => Material::where('is_active', true)->count(),
                'by_type'  => Material::selectRaw('material_type, COUNT(*) as total')->groupBy('material_type')->pluck('total', 'material_type'),
                'used'     => Material::whereHas('sessionActivities')->count(),
            ],
        ]);
    }

    public function store(MaterialRequest $request) {
        $material = Material::create($request->validated());
        return new MaterialResource($material->load(['curriculum', 'tentor.user']));
    }

    public function show(Material $material) {
        return new MaterialResource($material->load(['curriculum', 'tentor.user']));
    }

    public function update(MaterialRequest $request, Material $material) {
        // $material->update($request->validated());
        $validated = $request->validated();
        // Hapus berkas lama bila diganti berkas baru
        if (!empty($validated['file_path']) && $material->file_path !== $validated['file_path']) {
            MaterialFileService::delete($material->file_path);
        }

        $material->update($validated);
        return new MaterialResource($material->fresh(['curriculum', 'tentor.user']));
    }

    public function toggleStatus(Material $material) {
        $material->update(['is_active' => !$material->is_active]);
        return response()->json(['message' => 'Status materi berhasil diubah.', 'is_active' => $material->is_active]);
    }

    public function destroy(Material $material) {
        // Materi yang sudah dipakai aktivitas sesi tetap disimpan agar riwayat kelas utuh
        $usage = SessionActivity::where('activityable_type', 'material')->where('activityable_id', $material->id)->count();
        if ($usage > 0) {
            return response()->json([
                'message' => "Materi sudah dipakai di {$usage} aktivitas sesi sehingga tidak dapat dihapus. Nonaktifkan materi sebagai gantinya.",
            ], 422);
        }

        MaterialFileService::delete($material->file_path);
        $material->delete();
        return response()->json(['message' => 'Materi berhasil dihapus.']);
    }
}