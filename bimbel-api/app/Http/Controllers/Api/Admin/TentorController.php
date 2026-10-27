<?php

namespace App\Http\Controllers\Api\Admin;

use App\Support\SafeDelete;
use App\Http\Controllers\Controller;
use App\Models\Admin\Role;
use App\Models\Admin\Tentor;
use App\Models\Admin\User;
use App\Models\Admin\Subject;
use App\Http\Requests\Admin\TentorRequest;
use App\Http\Resources\Admin\TentorResource;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Validation\Rule;

class TentorController extends Controller {

    public function index(Request $request) {
        $query = Tentor::with([
            'user',
            'subjects.educationLevel',
        ])
        ->withCount([
            'subjects',
            // Gunakan conditional check jika method relation schedules ada pada model Tentor
            'schedules as active_schedules_count' => function ($q) {
                if (method_exists($q->getModel(), 'schedules')) {
                    $q->where('is_active', true);
                }
            },
        ]);

        // Search Keyword (Pencarian Nama, Email, Phone, NIK, Spesialisasi)
        if ($request->filled('keyword')) {
            $keyword = $request->keyword;
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

        // Status Filter
        if ($request->filled('status')) {
            $status = filter_var($request->status, FILTER_VALIDATE_BOOLEAN);
            $query->where('is_active', $status);
        }

        // Specialization Filter
        if ($request->filled('specialization')) {
            $query->where('specialization', $request->specialization);
        }

        $perPage = $request->integer('per_page', 10);
        $tentors = $query->latest()->paginate($perPage)->withQueryString();

        return TentorResource::collection($tentors);
    }

    public function summary() {
        $total = Tentor::count();
        $active = Tentor::where('is_active', true)->count();
        $inactive = Tentor::where('is_active', false)->count();
        $unplotted = Tentor::doesntHave('subjects')->count();

        return response()->json([
            'success' => true,
            'data' => [
                'total'     => $total,
                'active'    => $active,
                'inactive'  => $inactive,
                'unplotted' => $unplotted,
            ]
        ]);
    }

    public function show($id) {
        $tentor = Tentor::with([
            'user',
            'subjects.educationLevel',
        ]);

        // Cek secara kondisional apakah relasi schedules terdaftar di model
        if (method_exists(Tentor::class, 'schedules')) {
            $tentor->with(['schedules.classroom', 'schedules.subject']);
        }

        $result = $tentor->withCount(['subjects'])->findOrFail($id);

        return new TentorResource($result);
    }

    public function store(TentorRequest $request) {
        $data = $request->validated();
        DB::beginTransaction();

        try {
            $role = Role::where('role_name', 'tentor')->firstOrFail();

            $user = User::create([
                'role_id'   => $role->id,
                'name'      => $data['name'],
                'email'     => $data['email'],
                'phone'     => $data['phone'],
                'password'  => Hash::make($data['password'] ?? '12345678'),
                'is_active' => $data['is_active'] ?? true,
            ]);

            $tentor = Tentor::create([
                'user_id'        => $user->id,
                'specialization' => $data['specialization'],
                'education'      => $data['education'],
                'joining_date'   => $data['joining_date'] ?? now(),
                'nik'            => $data['nik'],
                'gender'         => $data['gender'],
                'birth_date'     => $data['birth_date'],
                'address'        => $data['address'] ?? null,
                'photo'          => $data['photo'] ?? null,
                'is_active'      => $data['is_active'] ?? true,
            ]);

            if (!empty($data['subject_ids'])) {
                $tentor->subjects()->sync($data['subject_ids']);
            }

            DB::commit();
            return new TentorResource($tentor->load(['user', 'subjects']));
        } catch (\Throwable $e) {
            DB::rollBack();
            throw $e;
        }
    }

    public function update(TentorRequest $request, Tentor $tentor) {
        $data = $request->validated();

        $tentor->update($data);
        if ($tentor->user) {
            $tentor->user->update([
                'name'      => $data['name'] ?? $tentor->user->name,
                'phone'     => $data['phone'] ?? $tentor->user->phone,
                'is_active' => $data['is_active'] ?? $tentor->user->is_active,
            ]);
        }

        return new TentorResource($tentor->fresh()->load(['user', 'subjects']));
    }

    public function toggleStatus(Tentor $tentor) {
        $newStatus = !$tentor->is_active;

        DB::transaction(function () use ($tentor, $newStatus) {
            $tentor->update(['is_active' => $newStatus]);
            if ($tentor->user) {
                $tentor->user->update(['is_active' => $newStatus]);
            }
        });

        return response()->json([
            'success'   => true,
            'message'   => 'Status tentor berhasil diperbarui.',
            'is_active' => $newStatus,
        ]);
    }

    public function destroy($id) {
        $tentor = Tentor::findOrFail($id);
        SafeDelete::run(function () use ($tentor) {
            $user = $tentor->user;
            $tentor->delete();
            $user?->delete();
        }, 'Tentor sudah memiliki jadwal, sesi mengajar, atau riwayat honor sehingga tidak dapat dihapus. Nonaktifkan tentor sebagai gantinya.');

        return response()->json(['success' => true, 'message' => 'Data tentor berhasil dihapus.']);
    }

    public function assign(Request $request, Tentor $tentor) {
        $request->validate([
            'subject_ids'   => ['nullable', 'array'],
            'subject_ids.*' => ['nullable', Rule::exists(Subject::class, 'id')],
        ]);

        $tentor->subjects()->sync($request->subject_ids ?? []);

        return response()->json([
            'success' => true,
            'message' => 'Plotting mata pelajaran berhasil diperbarui.'
        ]);
    }
}