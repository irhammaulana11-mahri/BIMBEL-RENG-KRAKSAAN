<?php

namespace App\Http\Controllers\Api\Academic;

use App\Http\Controllers\Controller;
use App\Http\Requests\Academic\LearningLocationRequest;
use App\Http\Resources\Academic\LearningLocationResource;
use App\Models\Academic\LearningLocation;
use App\Models\Academic\Schedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Database\Eloquent\Builder;

class LearninglocationController extends Controller {
    public function summary() {
        $total = LearningLocation::count();
        $active = LearningLocation::where('is_active', true)->count();
        $inactive = LearningLocation::where('is_active', false)->count();

        // Hitung total kelas terikat di lokasi aktif
        $totalClasses = DB::table('classes')
            ->whereNull('deleted_at')
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('schedules')
                    ->whereColumn('schedules.class_id', 'classes.id');
            })->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total'         => $total,
                'active'        => $active,
                'inactive'      => $inactive,
                'total_classes' => $totalClasses,
            ]
        ]);
    }

    public function index(Request $request) {
        $query = LearningLocation::query()
            ->withCount([
                'schedules as active_schedules_count' => function ($q) {
                    $q->where('is_active', true);
                }
            ]);

        // Keyword Search
        if ($request->filled('keyword')) {
            $keyword = trim($request->keyword);
            $query->where(function (Builder $q) use ($keyword) {
                $q->where('code', 'ILIKE', "%{$keyword}%")
                  ->orWhere('location_name', 'ILIKE', "%{$keyword}%")
                  ->orWhere('address', 'ILIKE', "%{$keyword}%");
            });
        }

        // Status Filter
        if ($request->filled('status')) {
            $status = filter_var($request->status, FILTER_VALIDATE_BOOLEAN);
            $query->where('is_active', $status);
        }

        $perPage = $request->integer('per_page', 10);
        $locations = $query->latest()->paginate($perPage)->withQueryString();

        return LearningLocationResource::collection($locations);
    }

    public function store(LearningLocationRequest $request) {
        $location = LearningLocation::create($request->validated());
        return new LearningLocationResource($location);
    }

    public function show(LearningLocation $location) {
        $location->load([
            'schedules' => function ($q) {
                $q->with(['subject', 'classroom', 'tentor.user'])
                  ->where('is_active', true);
            }
        ])->loadCount(['schedules']);

        return new LearningLocationResource($location);
    }

    public function update(LearningLocationRequest $request, LearningLocation $location) {
        $location->update($request->validated());

        return new LearningLocationResource(
            $location->fresh()->loadCount('schedules')
        );
    }

    public function toggleStatus(LearningLocation $location) {
        $location->update(['is_active' => !$location->is_active]);

        return response()->json([
            'success'   => true,
            'message'   => 'Status lokasi berhasil diperbarui.',
            'is_active' => $location->is_active,
        ]);
    }

    public function destroy(LearningLocation $location) {
        if ($location->schedules()->exists()) {
            return response()->json([
                'message' => 'Gagal menghapus! Lokasi masih digunakan pada jadwal belajar aktif.',
            ], 422);
        }

        $location->delete();

        return response()->json([
            'message' => 'Lokasi belajar berhasil dihapus.',
        ]);
    }
}