<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\Admin\ParentModel;
use App\Models\Admin\User;
use App\Support\SafeDelete;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\ParentRequest;
use App\Http\Resources\Admin\ParentResource;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;


class ParentController extends Controller {
    
    public function index(Request $request) {
        $query = ParentModel::query()
            ->with('students')
            ->with('user')
            ->withCount('students');
            

         // | Keyword Search
        if ($request->filled('keyword')) {
            $keyword = trim($request->keyword);
            $query->where(function (Builder $q) use ($keyword) {
                $q->where('full_name', 'ILIKE', "%{$keyword}%")
                    ->orWhere('address', 'ILIKE', "%{$keyword}%")
                    ->orWhere('occupation', 'ILIKE', "%{$keyword}%");
            });

        }

        if ($request->filled('status')) {
            $status = filter_var($request->status, FILTER_VALIDATE_BOOLEAN);
            $query->whereHas('user', function ($q) use ($status) {
                $q->where('is_active', $status);
            });
        }


        if ($request->filled('children')) {
            if ($request->children === 'yes') {
                $query->has('students');
            } elseif ($request->children === 'no') {
                $query->doesntHave('students');
            }
        }

        // | Pagination
        $perPage = $request->integer('per_page', 10);

        $parents = $query
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        return ParentResource::collection($parents);
    }

    public function show(ParentModel $parent) {
        $parent->load(['students']);
        $parent->loadCount('students');
        return new ParentResource($parent);
    }

    public function update(ParentRequest $request,ParentModel $parent) {
        $parent->update($request->validated());

        return new ParentResource(
            $parent->fresh()
                    ->load([
                        'user',
                        'students'
                    ])
                    ->loadCount('students')
        );
    }

    // Akun login orang tua ikut dihapus; data anak tetap ada
    public function destroy(ParentModel $parent) {
        SafeDelete::run(function () use ($parent) {
            $user = $parent->user;
            $parent->delete();
            $user?->delete();
        }, 'Akun orang tua masih terhubung dengan data lain sehingga tidak dapat dihapus.');

        return response()->json(['message' => 'Data orang tua berhasil dihapus.']);
    }
}