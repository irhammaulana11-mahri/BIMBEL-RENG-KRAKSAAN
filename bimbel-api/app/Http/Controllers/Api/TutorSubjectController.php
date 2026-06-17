<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tutor;
use App\Models\TutorSubject;
use Illuminate\Http\Request;

class TutorSubjectController extends Controller {
    public function assign(Request $request,$tutorId) {
        $request->validate(['subject_ids' => 'required|array']);
        $tutor = Tutor::findOrFail($tutorId);
        $tutor->subjects()->sync($request->subject_ids);

        return ['success' => true];
    }
    public function index() {
        return response()->json(TutorSubject::with(['tutor.user','subject'])->get());
    }

    public function show($id) {
        return response()->json(TutorSubject::with(['tutor.user','subject'])->findOrFail($id));
    }

    public function store(Request $request) {
        $request->validate(['tutor_id' => 'required','subject_id' => 'required']);

        $data = TutorSubject::create([
            'tutor_id' => $request->tutor_id,
            'subject_id' => $request->subject_id
        ]);

        return response()->json(['success' => true,'data' => $data], 201);
    }

    public function update(Request $request, $id) {
        $data = TutorSubject::findOrFail($id);

        $data->update($request->all());

        return response()->json(['success' => true,'data' => $data]);
    }

    public function destroy($id) {
        TutorSubject::findOrFail($id)->delete();

        return response()->json(['success' => true]);
    }
}