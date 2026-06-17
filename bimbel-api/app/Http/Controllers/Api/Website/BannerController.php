<?php

namespace App\Http\Controllers\Api\Website;

use App\Http\Controllers\Controller;
use App\Http\Requests\Website\BannerRequest;
use App\Http\Resources\Website\BannerResource;
use App\Models\Website\Banner;
use App\Http\Controllers\Api\BaseApiController;

class BannerController extends BaseApiController {
    public function index() {
        // return BannerResource::collection(Banner::orderBy('sort_order')->get());
        return $this->success(BannerResource::collection(Banner::all()
    ),
    'Banner retrieved successfully'
);
    }

    public function store(BannerRequest $request) {
        $banner = Banner::create($request->validated());

        return $this->success(new BannerResource($banner),'Banner created successfully',201);
    }

    public function show(Banner $banner) {
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