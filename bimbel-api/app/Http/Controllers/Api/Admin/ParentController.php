<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Admin\ParentModel;
use App\Models\Admin\User;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ParentRequest;
use App\Http\Resources\Admin\ParentResource;

class ParentController extends Controller
{
    public function index() {
        return ParentResource::collection(
            ParentModel::with('user')
                ->withCount('students')
                ->latest()
                ->get()
        );
    }

    public function show(ParentModel $parent) {
        return new ParentResource($parent->load(['user','students']));
    }

    public function update(ParentRequest $request,ParentModel $parent) {
        $parent->update($request->validated());
        return new ParentResource($parent->fresh()->load('user'));
    }

    public function destroy(ParentModel $parent) {
        $parent->delete();
        return response()->json(['message' => 'Parent deleted']);
    }
}