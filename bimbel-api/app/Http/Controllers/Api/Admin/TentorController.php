<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\Role;
use App\Models\Admin\Tentor;
use App\Models\Admin\User;
use App\Models\Admin\Subject;
use App\Http\Requests\Admin\TentorRequest;
use App\Http\Requests\Admin\UserRequest;
use App\Http\Resources\Admin\TentorResource;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;


class TentorController extends Controller {
    public function index(Request $request) {
        $query = Tentor::with([
            'user',
            'subjects',
        ]);

        // | Search
        if ($request->filled('keyword')) {
            $search = $request->keyword;
            $query->where(function (Builder $q) use ($keyword) {
                $q->whereHas('user', function ($user) use ($keyword) {
                    $user->where('name', 'ILIKE', "%{$keyword}%")
                        ->orWhere('email', 'ILIKE', "%{$keyword}%")
                        ->orWhere('phone', 'ILIKE', "%{$keyword}%");
                })
                ->orWhere('specialization', 'ILIKE', "%{$keyword}%")
                ->orWhere('education', 'ILIKE', "%{$keyword}%")
                ->orWhere('nik', 'ILIKE', "%{$keyword}%");
            });
        }

        // | Status
        if ($request->filled('status')) {
            $status = filter_var($request->status, FILTER_VALIDATE_BOOLEAN);
            $query->where('is_active', $status);
        }

        // | Specialization
        if ($request->filled('specialization')) {
            $query->where(
                'specialization',
                $request->specialization
            );
        }
       
        // | Statistics
        $stats = [
            'total' => Tentor::count(),
            'active' => Tentor::where('is_active', true)->count(),
            'without_subject' => Tentor::doesntHave('subjects')->count(),
        ];

         // | Pagination
        $perPage = $request->integer('per_page', 10);

        $tentors = $query
            ->latest()
            ->paginate($perPage)
            ->withQueryString();

        // return response()->json([
        //     'stats' => $stats,
        //     'data' => TentorResource::collection($tentors),
        //     'meta' => [
        //         'current_page' => $tentors->currentPage(),
        //         'last_page' => $tentors->lastPage(),
        //         'total' => $tentors->total(),
        //     ]

        // ]);
        return TentorResource::collection($tentors);

    }

    public function show($id) {
        return Tentor::with(['user','subjects'])->findOrFail($id);
    }

    public function store(TentorRequest $request) {
        $data = $request->validated();

        DB::beginTransaction();

        try {

            $role = Role::where('role_name', 'tentor')->firstOrFail();

            // Buat User Login
            $user = User::create([
                'role_id'   => $role->id,
                'name'      => $data['name'],
                'email'     => $data['email'],
                'phone'     => $data['phone'],
                'password'  => Hash::make($data['password'] ?? '12345678'),
                'is_active' => $data['is_active'] ?? true,
            ]);

            // Buat Profil Tentor
            $tentor = Tentor::create([
                'user_id'        => $user->id,
                'specialization' => $data['specialization'],
                'education'      => $data['education'],
                'joining_date'   => now(),
                'nik'            => $data['nik'],
                'gender'         => $data['gender'],
                'birth_date'     => $data['birth_date'],
                'address'        => $data['address'] ?? null,
                'latitude'       => $data['latitude'] ?? null,
                'longitude'      => $data['longitude'] ?? null,
                'is_active'      => $data['is_active'] ?? true,
            ]);

            // Plot Mata Pelajaran
            if (!empty($data['subject_ids'])) {
                $tentor->subjects()->sync($data['subject_ids']);
            }

            DB::commit();

            return new TentorResource(
                $tentor->load([
                    'user',
                    'subjects',
                ])
            );

        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function update(TentorRequest $request, Tentor $tentor) {
        $tentor->update($request->validated());
        $tentor->user->update($request->validated());

        return new TentorResource(
                $tentor->fresh()->load(['user','subjects',]));
    }

    public function destroy($id) {
        Tentor::findOrFail($id)->delete();

        return ['success' => true];
    }

    public function assign(Request $request, Tentor $tentor) {
        $request->validate([
            'subject_ids' => ['required', 'array'],
        ]);

        $tentor->subjects()->sync($request->subject_ids);

        return response()->json([
            'success' => true,
            'message' => 'Subject berhasil diperbarui.'
        ]);
    }
}