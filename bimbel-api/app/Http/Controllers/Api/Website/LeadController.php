<?php

namespace App\Http\Controllers\Api\Website;

use App\Models\Website\Lead;
use App\Http\Controllers\Controller;
use App\Http\Requests\Website\LeadRequest;
use App\Http\Resources\Website\LeadResource;

class LeadController extends Controller {
    public function index() {
        return LeadResource::collection(
            Lead::with('package')
                ->latest()
                ->get()
        );
    }

    public function store(LeadRequest $request) {
        $data = $request->validated();

        $data['status'] =
            $data['status']
            ?? 'NEW';

        $lead = Lead::create(
            $data
        );

        return new LeadResource($lead->load('package'));
    }

    public function show(Lead $lead) {
        return new LeadResource($lead->load('package'));
    }

    public function update(LeadRequest $request,Lead $lead) {
        $lead->update($request->validated());

        return new LeadResource($lead->fresh()->load('package'));
    }

    public function destroy(Lead $lead) {
        $lead->delete();

        return response()->json(['message' => 'Deleted successfully']);
    }
}