<?php

namespace App\Http\Controllers\Api\Website;

use App\Http\Controllers\Controller;
use App\Http\Requests\Website\CompanyProfileRequest;
use App\Http\Resources\Website\CompanyProfileResource;
use App\Models\Website\CompanyProfile;

class CompanyProfileController extends Controller {
    public function index() {
        return new CompanyProfileResource(CompanyProfile::first());
    }

    public function store(CompanyProfileRequest $request) {
        $data = CompanyProfile::create($request->validated());

        return new CompanyProfileResource($data);
    }

    public function show(CompanyProfile $companyProfile) {
        return new CompanyProfileResource($companyProfile);
    }

    public function update(CompanyProfileRequest $request,CompanyProfile $companyProfile) {
        $companyProfile->update($request->validated());

        return new CompanyProfileResource($companyProfile->fresh()
        );
    }

    public function destroy(CompanyProfile $companyProfile) {
        $companyProfile->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}