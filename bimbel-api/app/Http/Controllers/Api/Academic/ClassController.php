<?php

namespace App\Http\Controllers\Api\Academic;

use App\Http\Controllers\Controller;
use App\Http\Requests\Academic\ClassRequest;
use App\Http\Resources\Academic\ClassResource;
use App\Models\Academic\ClassRoom;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;

class ClassController extends Controller
{
    public function index(Request $request)
    {
        $query = ClassRoom::query()
            ->with(['students.user',])
            ->withCount([
                'students',
                'schedules',
            ]);

        // | Search
        if ($request->filled('keyword')) {
            $keyword = $request->keyword;
            $query->where(function ($q) use ($keyword) {
                $q->where('code', 'ILIKE', "%{$keyword}%")
                    ->orWhere('name', 'ILIKE', "%{$keyword}%")
                    ->orWhere('education_level', 'ILIKE', "%{$keyword}%");
            });
        }

        // | Status
        if ($request->filled('status')) {
            $query->where('is_active',$request->status == 'true');
        }

        // | Class Type
        if ($request->filled('class_type')) {
            $query->where('class_type',$request->class_type);
        }

        // | Education Level
        if ($request->filled('education_level')) {
            $query->where('education_level',$request->education_level);
        }

        $perPage = $request->integer('perPage', 10);

        $classes = $query
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return ClassResource::collection($classes);
    }

    public function store(ClassRequest $request) {
        $class = ClassRoom::create($request->validated());
        return new ClassResource($class->loadCount(['students','schedules',])
        );
    }

    public function show(ClassRoom $class) {
        return new ClassResource(
            $class->load(['students.user',])
                    ->loadCount(['students','schedules',])
        );
    }

    public function update(ClassRequest $request,ClassRoom $class) {
        $class->update($request->validated());
        return new ClassResource(
            $class->fresh()->loadCount([
                'students',
                'schedules',
            ])
        );
    }

    public function destroy(ClassRoom $class) {
        $class->delete();
        return response()->json([
            'success' => true,
            'message' => 'Class berhasil dihapus.'
        ]);
    }

}