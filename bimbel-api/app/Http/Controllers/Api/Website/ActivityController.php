<?php

namespace App\Http\Controllers\Api\Website;

use App\Http\Controllers\Controller;
use App\Http\Requests\Website\ActivityRequest;
use App\Http\Resources\Website\ActivityResource;
use App\Models\Website\Activity;

class ActivityController extends Controller {
    public function index() {
        return ActivityResource::collection(
            Activity::with('images')
                ->orderByDesc('activity_date')
                ->get()
        );
    }

    public function store(ActivityRequest $request) {
        $activity = Activity::create($request->validated());

        return new ActivityResource($activity);
    }

    public function show(Activity $activity) {
        return new ActivityResource($activity->load('images'));
    }

    public function update(ActivityRequest $request,Activity $activity) {
        $activity->update($request->validated());

        return new ActivityResource($activity->fresh());
    }

    public function destroy(Activity $activity) {
        $activity->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}