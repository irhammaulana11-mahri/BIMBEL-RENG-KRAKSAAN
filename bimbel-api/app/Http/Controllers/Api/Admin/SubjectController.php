<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SubjectRequest;
use App\Http\Resources\Admin\SubjectResource;
use App\Models\Admin\User;
use App\Models\Admin\Subject;
use App\Models\Admin\Tentor;
use App\Models\Admin\TentorSubject;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Builder;


class SubjectController extends Controller {
    public function index(Request $request) {
        $query = Subject::query()
            ->with(['tentors']);
        
         // | Keyword Search
        if ($request->filled('keyword')) {
            $keyword = trim($request->keyword);
            $query->where(function (Builder $q) use ($keyword) {
                $q->where('code', 'ILIKE', "%{$keyword}%")
                    ->orWhere('name', 'ILIKE', "%{$keyword}%")
                    ->orWhereHas('tentors', function ($tentor) use ($keyword) {
                        $tentor->where('full_name', 'ILIKE', "%{$keyword}%");
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

        $subjects = $query
            ->latest()
            ->paginate($perPage)
            ->withQueryString();
     

        return SubjectResource::collection($subjects);
    }


    public function show(Subject $subject) {
        return new SubjectResource($subject->load(['tentors.user',]));
    }


    public function store(SubjectRequest $request) {
        $subject = Subject::create($request->validated());
        return new SubjectResource($subject);
        
    }


    public function update(SubjectRequest $request,Subject $subject) {
        $subject->update($request->validated());
        return new SubjectResource($subject->fresh());
    }

    
    public function destroy(Subject $subject) {
         $subject->delete();
        return response()->json(['message' => 'Subject deleted successfully.']);
    }
}