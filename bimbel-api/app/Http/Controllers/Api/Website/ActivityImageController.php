<?php

namespace App\Http\Controllers\Api\Website;

use App\Http\Controllers\Controller;
use App\Http\Requests\Website\ActivityImageRequest;
use App\Http\Resources\Website\ActivityImageResource;
use App\Models\Website\ActivityImage;

class ActivityImageController extends Controller {
    public function store(ActivityImageRequest $request) {
        $image = ActivityImage::create($request->validated());

        return new ActivityImageResource($image);
    }

    public function destroy(ActivityImage $activityImage) {
        $activityImage->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}