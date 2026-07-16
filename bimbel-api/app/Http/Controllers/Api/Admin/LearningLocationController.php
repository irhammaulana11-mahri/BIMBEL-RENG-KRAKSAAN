<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\LearningLocation;
use Illuminate\Http\Request;

class LearningLocationController extends Controller {
    public function index() {
        return response()->json(LearningLocation::all());
    }

    public function show($id) {
        return response()->json(LearningLocation::findOrFail($id));
    }

    public function store(Request $request) {
        $request->validate([
            'location_name' => 'required',
            'location_type' => 'required',
            'latitude' => 'required',
            'longitude' => 'required'
        ]);

        $location = LearningLocation::create([
            'location_name' => $request->location_name,
            'location_type' => $request->location_type,
            'address' => $request->address,
            'latitude' => $request->latitude,
            'longitude' => $request->longitude,
            'radius_meter' => $request->radius_meter,
            'is_active' => $request->is_active ?? true
        ]);

        return response()->json(['success' => true,'data' => $location], 201);
    }

    public function update(Request $request, $id) {
        $location = LearningLocation::findOrFail($id);

        $location->update($request->all());

        return response()->json(['success' => true,'data' => $location]);
    }

    public function destroy($id) {
        LearningLocation::findOrFail($id)->delete();

        return response()->json(['success' => true]);
    }
}