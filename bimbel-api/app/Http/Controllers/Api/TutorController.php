<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Tutor;
use Illuminate\Http\Request;

class TutorController extends Controller {
    public function index() {
        return Tutor::with(['user','subjects'])->get();}

    public function show($id) {
        return Tutor::with(['user','subjects'])->findOrFail($id);
    }

    public function store(Request $request) {
        $data = $request->validate([
            'user_id' => 'required|uuid',
            'specialization' => 'required',
            'education' => 'required',
            'joining_date' => 'required|date',
            'nik' => 'required',
            'gender' => 'required',
            'birth_date' => 'required|date',
            'address' => 'nullable',
            'latitude' => 'nullable|numeric',
            'longitude' => 'nullable|numeric'
        ]);

        return Tutor::create($data);
    }

    public function update(Request $request,$id) {
        $tutor = Tutor::findOrFail($id);

        $tutor->update($request->all());
        return $tutor;
    }

    public function destroy($id) {
        Tutor::findOrFail($id)->delete();

        return ['success' => true];
    }
}