<?php

namespace App\Http\Controllers\Api\Academic;

use App\Models\Admin\Subject;

use App\Http\Controllers\Controller;
use App\Models\Academic\Curriculum;
use App\Http\Requests\Academic\CurriculumRequest;
use App\Http\Resources\Academic\CurriculumResource;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;

class CurriculumController extends Controller {
    public function index(Request $request) {
        $query = Curriculum::query()->with(['subject'])->withCount('materials');

        if ($request->filled('subject_id')) {
            $query->where('subject_id', $request->subject_id);
        }

        if ($request->filled('keyword')) {
            $keyword = trim($request->keyword);
            $query->where('title', 'ILIKE', "%{$keyword}%");
        }

        $query->orderBy('semester', 'asc')->orderBy('order_no', 'asc');
        $data = $query->paginate($request->integer('per_page', 15))->withQueryString();

        return CurriculumResource::collection($data);
    }

    public function store(CurriculumRequest $request) {
        $data = $request->validated();
        // Jenjang wajib di database: ikuti jenjang mapel bila tidak dikirim
        $data['education_level_id'] ??= Subject::whereKey($data['subject_id'])->value('education_level_id');
        $curriculum = Curriculum::create($data);
        return new CurriculumResource($curriculum->load('subject'));
    }

    public function show(Curriculum $curriculum) {
        return new CurriculumResource($curriculum->load(['subject', 'materials'])->loadCount('materials'));
    }

    public function update(CurriculumRequest $request, Curriculum $curriculum) {
        $curriculum->update($request->validated());
        return new CurriculumResource($curriculum->fresh('subject'));
    }

    public function toggleStatus(Curriculum $curriculum) {
        // if ($curriculum->is_active) {
        //     $materialsCount = $curriculum->materials()->count();
        //     if ($materialsCount > 0) {
        //         return response()->json([
        //             'message' => "Kurikulum ini memiliki {$materialsCount} materi. Tidak dapat dinonaktifkan."
        //         ], 422);
        //     }
        // }
        $curriculum->update(['is_active' => !$curriculum->is_active]);
        return response()->json(['message' => 'Status berhasil diubah.', 'is_active' => $curriculum->is_active]);
    }

    public function destroy(Curriculum $curriculum) {
        $materialsCount = $curriculum->materials()->count();
        if ($materialsCount > 0) {
            return response()->json([
                'message' => "Kurikulum ini tidak dapat dihapus karena masih memiliki {$materialsCount} materi."
            ], 422);
        }
        $curriculum->delete();
        return response()->json(['message' => 'Kurikulum berhasil dihapus.']);
    }
}