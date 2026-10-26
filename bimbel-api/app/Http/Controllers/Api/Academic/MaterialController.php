<?php

namespace App\Http\Controllers\Api\Academic;

use App\Http\Controllers\Controller;
use App\Models\Academic\Material;
use App\Http\Requests\Academic\MaterialRequest;
use App\Http\Resources\Academic\MaterialResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class MaterialController extends Controller {
    public function index(Request $request) {
        $query = Material::query()->with(['curriculum', 'tentor.user']);

        if ($request->filled('curriculum_id')) {
            $query->where('curriculum_id', $request->curriculum_id);
        }

        if ($request->filled('keyword')) {
            $keyword = trim($request->keyword);
            $query->where('title', 'ILIKE', "%{$keyword}%");
        }

        $query->orderBy('sort_order', 'asc');
        $data = $query->paginate($request->integer('per_page', 15))->withQueryString();

        return MaterialResource::collection($data);
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
        // 🟢 Hapus file lama jika ada file_path baru yang diunggah menggantikannya
        if (!empty($validated['file_path']) && $material->file_path !== $validated['file_path']) {
            $oldPath = str_replace('/storage/', '', $material->file_path);
            if (Storage::disk('public')->exists($oldPath)) {
                Storage::disk('public')->delete($oldPath);
            }
        }

        $material->update($validated);
        return new MaterialResource($material->fresh(['curriculum', 'tentor.user']));
    }

    public function toggleStatus(Material $material) {
        $material->update(['is_active' => !$material->is_active]);
        return response()->json(['message' => 'Status materi berhasil diubah.', 'is_active' => $material->is_active]);
    }

    public function destroy(Material $material) {
        // Materi umumnya adalah leaf node (ujung relasi), jadi aman untuk langsung dihapus.
        if (!empty($material->file_path)) {
            $path = str_replace('/storage/', '', $material->file_path);
            if (Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
        }
        $material->delete();
        return response()->json(['message' => 'Materi berhasil dihapus.']);
    }
}