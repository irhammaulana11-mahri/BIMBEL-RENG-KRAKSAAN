<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\Student;
use App\Models\Admin\User;
use App\Models\Admin\ParentController;
use App\Services\Student\StudentService;
use App\Http\Requests\Admin\StudentRequest;
use App\Http\Resources\Admin\StudentResource;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;



class StudentController extends Controller
{
    public function __construct(
        protected StudentService $studentService
    ) {}

    public function index(Request $request) {
        $query = Student::query()
            ->with([
                'parents.user',
            ]);
        
         // | Keyword Search
        if ($request->filled('keyword')) {
            $keyword = trim($request->keyword);
            $query->where(function (Builder $q) use ($keyword) {
                $q->where('full_name', 'ILIKE', "%{$keyword}%")
                    ->orWhere('nis', 'ILIKE', "%{$keyword}%")
                    ->orWhereHas('parents', function ($parent) use ($keyword) {
                        $parent->where('full_name', 'ILIKE', "%{$keyword}%");
                    });
            });

        }

        if ($request->filled('status')) {
            $status = filter_var($request->status, FILTER_VALIDATE_BOOLEAN);
            $query->where('is_active', $status);
        }


        if ($request->filled('education_level')) {
            $query->where('education_level', $request->education_level);
        }

        // | Pagination
        $perPage = $request->integer('per_page', 10);

        $students = $query
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
     

        return StudentResource::collection($students);
    }


    public function show(Student $student) {
        return new StudentResource(
            Student::with(['user','parents.user'])
            ->findOrFail($id)
        );
    }


    public function store(StudentRequest $request)
    {
        $student = $this->studentService->create(
            $request->validated()
        );

        return new StudentResource(
            $student->load([
                'user',
                'parents.user',
            ])
        );
    }


    public function update(StudentRequest $request, Student $student) {
        // $student = Student::findOrFail($id);
        $student->update($request->validated());
        return new StudentResource(
            $student->fresh()->load(['user','parents.user',])
        );
    }

    public function destroy(Student $student) {
        Student::findOrFail($id)->delete();
        return response()->json([
            'message' => 'Student deleted'
        ]);
    }
}
