<?php

namespace App\Http\Controllers\Api\Website;

use App\Http\Controllers\Controller;
use App\Http\Requests\Website\TestimonialRequest;
use App\Http\Resources\Website\TestimonialResource;
use App\Models\Website\Testimonial;

class TestimonialController extends Controller {
    public function index() {
        return TestimonialResource::collection(
            Testimonial::orderByDesc('created_at')
                ->get()
        );
    }

    public function store(TestimonialRequest $request) {
        $testimonial = Testimonial::create($request->validated());

        return new TestimonialResource($testimonial);
    }

    public function show(Testimonial $testimonial) {
        return new TestimonialResource($testimonial);
    }

    public function update(TestimonialRequest $request,Testimonial $testimonial) {
        $testimonial->update($request->validated());

        return new TestimonialResource($testimonial->fresh());
    }

    public function destroy(Testimonial $testimonial) {
        $testimonial->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}