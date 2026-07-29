<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\Tentor;
use App\Models\Admin\TentorSubject;
use App\Http\Requests\Admin\TentorSubjectRequest; 
use Illuminate\Http\Request;

class TentorSubjectController extends Controller {
    public function assign(Request $request,$tentorId) {
        $request->validate(['subject_ids' => 'required|array']);
        $tentor = Tentor::findOrFail($tentorId);
        $tentor->subjects()->sync($request->subject_ids);

        return ['success' => true];
    }
    public function index() {
        return response()->json(TentorSubject::with(['tentor.user','subject'])->get());
    }

    public function show($id) {
        return response()->json(TentorSubject::with(['tentor.user','subject'])->findOrFail($id));
    }

    public function store(Request $request) {
        $request->validate(['tentor_id' => 'required','subject_id' => 'required']);

        $data = TentorSubject::create([
            'tentor_id' => $request->tentor_id,
            'subject_id' => $request->subject_id
        ]);

        return response()->json(['success' => true,'data' => $data], 201);
    }

    public function update(Request $request, $id) {
        $data = TentorSubject::findOrFail($id);
        $data->update($request->all());
        return response()->json(['success' => true,'data' => $data]);
    }

    public function destroy($id) {
        TentorSubject::findOrFail($id)->delete();
        return response()->json(['success' => true]);
    }
}