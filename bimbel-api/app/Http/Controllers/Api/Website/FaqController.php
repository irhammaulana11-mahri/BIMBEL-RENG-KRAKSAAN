<?php

namespace App\Http\Controllers\Api\Website;

use App\Http\Controllers\Api\Website\Concerns\PublicVisibility;

use App\Http\Controllers\Controller;
use App\Http\Requests\Website\FaqRequest;
use App\Http\Resources\Website\FaqResource;
use App\Models\Website\Faq;

class FaqController extends Controller {
    use PublicVisibility;

    public function index() {
        return FaqResource::collection(
            Faq::when(!$this->viewerIsCmsAdmin(), fn($q) => $q->where('is_active', true))->orderBy('sort_order')->get()
        );
    }

    public function store(FaqRequest $request) {
        $faq = Faq::create($request->validated());

        return new FaqResource($faq);
    }

    public function show(Faq $faq) {
        abort_if(!$faq->is_active && !$this->viewerIsCmsAdmin(), 404);
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