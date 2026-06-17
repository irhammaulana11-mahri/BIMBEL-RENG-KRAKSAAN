<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ClassStudent;
use Illuminate\Http\Request;

class ClassStudentController extends Controller {
    public function index() {
        return response()->json(ClassStudent::with(['classRoom','student.user'])->get());
    }

    public function show($id) {
        return response()->json(ClassStudent::with(['classRoom','student.user'])->findOrFail($id));
    }

    public function store(Request $request) {
        $request->validate(['class_id' => 'required','student_id' => 'required']);

        $data = ClassStudent::create([
            'class_id' => $request->class_id,
            'student_id' => $request->student_id
        ]);

        return response()->json(['success' => true,'data' => $data], 201);
    }

    public function update(Request $request, $id) {
        $data = ClassStudent::findOrFail($id);

        $data->update($request->all());

        return response()->json(['success' => true,'data' => $data]);
    }

    public function destroy($id) {
        ClassStudent::findOrFail($id)->delete();

        return response()->json(['success' => true]);
    }
}