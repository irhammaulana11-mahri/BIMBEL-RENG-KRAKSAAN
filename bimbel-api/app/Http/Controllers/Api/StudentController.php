<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Student;
use Illuminate\Http\Request;

class StudentController extends Controller
{
    public function index() {
        return Student::with('user')->orderBy('nis')->get();
    }

    public function show(string $id) {
        return Student::with('user')->findOrFail($id);
    }

    public function store(Request $request) {
        $validated = $request->validate([
            'user_id' => 'required|uuid',
            'nis' => 'required|max:30',
            'gender' => 'required|max:20',
            'birth_date' => 'required|date',
            'school_name' => 'required|max:150',
            'grade' => 'required|max:50',
            'address' => 'required'
        ]);

        $student = Student::create($validated);

        return response()->json(['success' => true,'data' => $student], 201);
    }

    public function update(Request $request,string $id) {

        $student = Student::findOrFail($id);

        $validated = $request->validate([
            'nis' => 'required|max:30',
            'gender' => 'required|max:20',
            'birth_date' => 'required|date',
            'school_name' => 'required|max:150',
            'grade' => 'required|max:50',
            'address' => 'required'
        ]);

        $student->update($validated);

        return response()->json(['success' => true,'data' => $student]);
    }

    public function destroy(string $id) {
        Student::findOrFail($id)->delete();

        return response()->json(['success' => true]);
    }
}
