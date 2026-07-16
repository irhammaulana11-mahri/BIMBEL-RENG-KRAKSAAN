<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\Subject;
use Illuminate\Http\Request;

class SubjectController extends Controller {
    public function index() {
        return Subject::all();
    }

    public function show($id) {
        return Subject::findOrFail($id);
    }

    public function store(Request $request) {
        $data = $request->validate(['code' => 'required|max:20','name' => 'required|max:100','description' => 'nullable']);
        return Subject::create($data);
    }

    public function update(Request $request,$id) {
        $subject = Subject::findOrFail($id);
        $subject->update($request->all());
        return $subject;
    }

    public function destroy($id) {
        Subject::findOrFail($id)->delete();
        return ['success' => true];
    }
}