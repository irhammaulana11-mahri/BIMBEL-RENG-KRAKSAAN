<?php

namespace App\Http\Controllers\Api\Website;

use App\Http\Controllers\Api\Website\Concerns\PublicVisibility;

use App\Http\Controllers\Controller;
use App\Http\Requests\Website\BannerRequest;
use App\Http\Resources\Website\BannerResource;
use App\Models\Website\Banner;
use App\Http\Controllers\Api\BaseApiController;

class BannerController extends BaseApiController {
    use PublicVisibility;

    public function index() {
        // Publik: banner aktif dalam rentang tanggal tayang
        $today = now('Asia/Jakarta')->toDateString();
        $banners = Banner::query()
            ->when(!$this->viewerIsCmsAdmin(), fn($q) => $q->where('is_active', true)
                ->where(fn($d) => $d->whereNull('start_date')->orWhereDate('start_date', '<=', $today))
                ->where(fn($d) => $d->whereNull('end_date')->orWhereDate('end_date', '>=', $today)))
            ->orderBy('sort_order')
            ->get();

        return $this->success(BannerResource::collection($banners),
    'Banner retrieved successfully'
);
    }

    public function store(BannerRequest $request) {
        $banner = Banner::create($request->validated());

        return $this->success(new BannerResource($banner),'Banner created successfully',201);
    }

    public function show(Banner $banner) {
        abort_if(!$banner->is_active && !$this->viewerIsCmsAdmin(), 404);
        return new BannerResource($banner);
    }

    public function update(BannerRequest $request,Banner $banner) {
        $banner->update($request->validated());

        return new BannerResource($banner->fresh());
    }

    public function destroy(Banner $banner) {
        $banner->delete();

        return $this->success(null,'Banner deleted successfully');
    }
}