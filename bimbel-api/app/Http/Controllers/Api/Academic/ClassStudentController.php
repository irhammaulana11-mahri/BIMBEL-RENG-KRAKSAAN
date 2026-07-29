<?php

namespace App\Http\Controllers\Api\Academic;

use App\Http\Controllers\Controller;
use App\Models\Academic\ClassStudent;
use App\Models\Academic\ClassRoom;
use App\Http\Requests\Academic\ClassStudentRequest;
use App\Http\Resources\Academic\ClassResource;
use App\Http\Resources\Academic\ClassStudentResource;
use Illuminate\Http\Request;


class ClassStudentController extends Controller {
    public function index(ClassRoom $class) {
        return ClassStudentResource::collection(
            $class
                ->students()
                ->with('user')
                ->get()
        );
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


    public function assign(ClassStudentRequest $request,ClassRoom $class) {
        $studentIds = $request->validated()['student_ids'];

        // | Validasi Kapasitas
        if (count($studentIds) > $class->max_students) {
            return response()->json([
                'message' => 'Jumlah siswa melebihi kapasitas kelas.'
            ],422);

        }

        // | PRIVATE
        if ($class->class_type === 'PRIVATE') {
            if(count($studentIds) > 2){
                return response()->json([
                    'message'=>
                    'Kelas private maksimal dua siswa.'
                ],422);
            }
        }

        // | Synchronize
        $class->students()->sync($studentIds);
        return new ClassResource(
            $class
                ->fresh()
                ->load(['students.user','schedules'])
                ->loadCount(['students','schedules'])
        );
    }


    public function remove(ClassRoom $class,string $student){
        $class->students()->detach($student);
        return response()->json([
            'success'=>true,
            'message'=>
            'Siswa berhasil dikeluarkan dari kelas.'
        ]);
    }
}