<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ParentModel;
use Illuminate\Http\Request;

class ParentController extends Controller {
    public function index() {
        return ParentModel::with(['user','students.user'])->get();
    }

    public function show(string $id) {
        return ParentModel::with(['user','students.user'])->findOrFail($id);
    }

    public function store(Request $request) {
        $validated = $request->validate([
            'user_id' => 'required|uuid',
            'full_name' => 'required|max:100',
            'occupation' => 'nullable|max:100',
            'relationship' => 'required|max:50',
            'address' => 'required'
        ]);
        $parent = ParentModel::create($validated);
        return response()->json(['success' => true,'data' => $parent],201);
    }

    public function update(Request $request,string $id) {
        $parent = ParentModel::findOrFail($id);
        $parent->update($request->only(['full_name','occupation','relationship','address']));
        return response()->json(['success' => true,'data' => $parent]);
    }

    public function destroy(string $id) {
        ParentModel::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }

    public function attachStudent(Request $request,string $parentId) {
        $request->validate(['student_id' => 'required|uuid']);
        $parent = ParentModel::findOrFail($parentId);
        $parent->students()->attach($request->student_id);
        return response()->json(['success' => true]);
    }
}