<?php

namespace App\Http\Controllers\Api\Academic;

use App\Http\Controllers\Controller;
use App\Http\Requests\Academic\LearningLocationRequest;
use App\Http\Resources\Academic\LearningLocationResource;
use App\Models\Academic\LearningLocation;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Builder;


class LearninglocationController extends Controller
{
    //  * Display a listing.
    public function index(Request $request) {
        $query = Learninglocation::query();

                // | Keyword Search
        if ($request->filled('keyword')) {
            $keyword = trim($request->keyword);
            $query->where(function (Builder $q) use ($keyword) {
                $q->where('code', 'ILIKE', "%{$keyword}%")
                    ->orWhere('location_name', 'ILIKE', "%{$keyword}%");
            });

        }

        if ($request->filled('status')) {
            $status = filter_var($request->status, FILTER_VALIDATE_BOOLEAN);
            $query->where('is_active', $status);
        }


        // | Pagination
        $perPage = $request->integer('per_page', 10);

        $locations = $query
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return LearninglocationResource::collection($locations);
    }

    //  * Store a newly created resource.
    public function store(LearninglocationRequest $request) {
        $locations = Learninglocation::create($request->validated());
        return new LearninglocationResource($locations);
    }

    //  * Display the specified resource.
    public function show(Learninglocation $location) {
        return new LearninglocationResource(
            $location->loadCount('schedules')
        );
    }

    //  * Update the specified resource.
    public function update(LearninglocationRequest $request,Learninglocation $location) {
        $location->update($request->validated());

        return new LearninglocationResource(
            $location->fresh()->loadCount('schedules')
        );
    }

    //  * Remove the specified resource.
    public function destroy(Learninglocation $location) {
        // | Cegah penghapusan jika masih dipakai Schedule
        if ($location->schedules()->exists()) {
            return response()->json([
                'message' => 'Lokasi masih digunakan pada jadwal belajar.',
            ], 422);

        }

        $location->delete();

        return response()->json([
            'message' => 'Lokasi belajar berhasil dihapus.',
        ]);
    }
}