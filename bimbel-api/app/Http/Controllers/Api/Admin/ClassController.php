<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\ClassRoom;
use Illuminate\Http\Request;

class ClassController extends Controller
{
    public function index() {
        return response()->json(ClassRoom::all());
    }

    public function show($id) {
        return response()->json(ClassRoom::findOrFail($id));
    }

    public function store(Request $request) {
        $request->validate([
            'class_name' => 'required',
            'level' => 'required'
        ]);

        $class = ClassRoom::create([
            'class_name' => $request->class_name,
            'level' => $request->level,
            'description' => $request->description
        ]);

        return response()->json(['success' => true,'data' => $class], 201);
    }

    public function update(Request $request, $id) {
        $class = ClassRoom::findOrFail($id);

        $class->update([
            'class_name' => $request->class_name,
            'level' => $request->level,
            'description' => $request->description
        ]);

        return response()->json(['success' => true,'data' => $class]);
    }

    public function destroy($id) {
        ClassRoom::findOrFail($id)->delete();

        return response()->json(['success' => true]);
    }
    //
}
