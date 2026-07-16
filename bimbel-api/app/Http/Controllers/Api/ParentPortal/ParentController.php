<?php

namespace App\Http\Controllers\Api\ParentPortal;

use App\Models\Admin\ParentModel;
use App\Http\Requests\Admin\ParentRequest;
use App\Http\Resources\Admin\ParentResource;
use App\Http\Controllers\Controller;
use Illuminate\Http\Request;


class ParentController extends Controller
{
    public function index(Request $request)
    {
        $query = ParentModel::with([
            'user',
            'students.user'
        ])->withCount('students');

        if ($request->filled('search')) {

            $search = $request->search;
            dd($search);
            $query->where(function ($q) use ($search) {

    $q->whereRaw(
        "LOWER(full_name) LIKE ?",
        ['%' . strtolower($search) . '%']
    )

    ->orWhereHas('user', function ($user) use ($search) {

        $user->whereRaw(
            "LOWER(phone) LIKE ?",
            ['%' . strtolower($search) . '%']
        )

        ->orWhereRaw(
            "LOWER(email) LIKE ?",
            ['%' . strtolower($search) . '%']
        );
    });
});
        }

        if ($request->status === 'aktif') {
            $query->whereHas('user', fn($q) => $q->where('is_active', true));
        }

        if ($request->status === 'nonaktif') {
            $query->whereHas('user', fn($q) => $q->where('is_active', false));
        }

        if ($request->child === 'yes') {
            $query->has('students');
        }

        if ($request->child === 'no') {
            $query->doesntHave('students');
        }

        
        dd($request->all());
        return response()->json(
    $query->latest()->paginate(10)
);
    }

    public function show(ParentModel $parent) {
        $parent->load(['user','students.user']);
        return new ParentResource($parent);
    }

    public function store(ParentRequest $request) {
        $parent = ParentModel::create($request->validated());
        return new ParentResource($parent);
    }

    public function update(ParentRequest $request,ParentModel $parent) {
        $parent->update($request->validated());
        return new ParentResource($parent->fresh());
    }

    public function destroy(ParentModel $parent) {
        $parent->delete();

        return response()->json([
            'message' => 'Data berhasil dihapus'
        ]);
    }

    public function attachStudent(Request $request,ParentModel $parent) {
        $request->validate(['student_id' => 'required|uuid']);
        $parent->students()->syncWithoutDetaching([$request->student_id]);
        return response()->json(['message' => 'Student berhasil ditambahkan']);
    }

    public function detachStudent(ParentModel $parent,string $student) {
        $parent->students()->detach($student);
        return response()->json(['message' => 'Student berhasil dilepas']);
    }
}
