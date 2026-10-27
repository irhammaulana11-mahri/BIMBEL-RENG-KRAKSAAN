<?php

namespace App\Http\Controllers\Api\Website;

use App\Http\Controllers\Api\Website\Concerns\PublicVisibility;

use App\Http\Controllers\Controller;
use App\Http\Requests\Website\ActivityRequest;
use App\Http\Resources\Website\ActivityResource;
use App\Models\Website\Activity;

class ActivityController extends Controller {
    use PublicVisibility;

    public function index() {
        return ActivityResource::collection(
            Activity::with('images')
                ->when(!$this->viewerIsCmsAdmin(), fn($q) => $q->where('is_active', true))
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

    public function showPublic(Activity $activity)
    {
        abort_if(!$activity->is_active && !$this->viewerIsCmsAdmin(), 404);

        return new ActivityResource(
            $activity->load('images')
        );
    }
}