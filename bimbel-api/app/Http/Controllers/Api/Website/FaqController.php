<?php

namespace App\Http\Controllers\Api\Website;

use App\Http\Controllers\Controller;
use App\Http\Requests\Website\FaqRequest;
use App\Http\Resources\Website\FaqResource;
use App\Models\Website\Faq;

class FaqController extends Controller {
    public function index() {
        return FaqResource::collection(Faq::orderBy('sort_order')->get());
    }

    public function store(FaqRequest $request) {
        $faq = Faq::create($request->validated());

        return new FaqResource($faq);
    }

    public function show(Faq $faq) {
        return new FaqResource($faq);
    }

    public function update(FaqRequest $request,Faq $faq) {
        $faq->update($request->validated());

        return new FaqResource($faq->fresh());
    }

    public function destroy(Faq $faq) {
        $faq->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}