<?php

namespace App\Http\Controllers\Api\Website;

use App\Http\Controllers\Controller;
use App\Http\Requests\Website\PackageRequest;
use App\Http\Resources\Website\PackageResource;
use App\Models\Website\Package;

class PackageController extends Controller {
    public function index() {
        return PackageResource::collection(
            Package::orderBy('education_level')
                ->orderBy('package_name')
                ->get()
        );
    }

    public function store(PackageRequest $request) {
        $package = Package::create($request->validated());
        return new PackageResource($package);
    }

    public function show(Package $package) {
        return new PackageResource($package);
    }

    public function update(PackageRequest $request,Package $package) {
        $package->update($request->validated());

        return new PackageResource($package->fresh());
    }

    public function destroy(Package $package) {
        $package->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}