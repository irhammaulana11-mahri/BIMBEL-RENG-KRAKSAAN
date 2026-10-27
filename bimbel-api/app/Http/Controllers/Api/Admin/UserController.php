<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\Role;
use App\Models\Admin\Student;
use App\Models\Admin\User;
use App\Support\LocalTime;
use App\Support\SafeDelete;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Manajemen akun login.
 * Akun baru di sini: staf (admin/super_admin) dan akun login siswa yang ditautkan ke data siswa.
 * Akun tentor & orang tua dibuat dari menu Tentor dan konversi Lead (wajib punya profil).
 * Akun super_admin hanya dapat dikelola oleh super_admin.
 */
class UserController extends Controller
{
    public const STAFF_ROLES = ['admin', 'super_admin'];
    public const CREATABLE_ROLES = ['admin', 'super_admin', 'siswa'];

    public const ROLE_LABELS = [
        'super_admin' => 'Super Admin',
        'admin'       => 'Admin',
        'tentor'      => 'Tentor',
        'orang_tua'   => 'Orang Tua',
        'siswa'       => 'Siswa',
    ];

    private const RELATIONS = ['role', 'student', 'parentProfile', 'tentor'];

    /** * GET /users */
    public function index(Request $request) {
        $request->validate([
            'keyword'  => ['nullable', 'string', 'max:100'],
            'role'     => ['nullable', Rule::in(array_keys(self::ROLE_LABELS))],
            'status'   => ['nullable', Rule::in(['active', 'inactive'])],
            'per_page' => ['nullable', 'integer', 'between:1,100'],
        ]);

        $users = User::with(self::RELATIONS)
            ->when($request->filled('keyword'), function ($q) use ($request) {
                $kw = '%' . trim($request->keyword) . '%';
                $q->where(fn($w) => $w->where('name', 'ILIKE', $kw)->orWhere('email', 'ILIKE', $kw)->orWhere('phone', 'ILIKE', $kw));
            })
            ->when($request->filled('role'), fn($q) => $q->whereHas('role', fn($r) => $r->where('role_name', $request->role)))
            ->when($request->filled('status'), fn($q) => $q->where('is_active', $request->status === 'active'))
            ->orderBy('name')
            ->paginate($request->integer('per_page', 15))
            ->withQueryString();

        $summary = DB::table('master.users')
            ->join('master.roles', 'master.roles.id', '=', 'master.users.role_id')
            ->selectRaw('master.roles.role_name, COUNT(*) as total, SUM(CASE WHEN master.users.is_active THEN 0 ELSE 1 END) as inactive')
            ->groupBy('master.roles.role_name')
            ->get()
            ->keyBy('role_name');

        return response()->json([
            'success' => true,
            'data'    => collect($users->items())->map(fn($u) => $this->present($u)),
            'meta'    => ['current_page' => $users->currentPage(), 'last_page' => $users->lastPage(), 'total' => $users->total(), 'per_page' => $users->perPage()],
            'summary' => collect(self::ROLE_LABELS)->map(fn($label, $role) => [
                'role'     => $role,
                'label'    => $label,
                'total'    => (int) ($summary[$role]->total ?? 0),
                'inactive' => (int) ($summary[$role]->inactive ?? 0),
            ])->values(),
        ]);
    }

    /** * GET /users/options: peran yang bisa dibuat & siswa yang belum punya akun */
    public function options() {
        $creatable = $this->isSuperAdmin() ? self::CREATABLE_ROLES : array_values(array_diff(self::CREATABLE_ROLES, ['super_admin']));

        return response()->json([
            'success' => true,
            'data'    => [
                'roles'    => Role::whereIn('role_name', $creatable)->get()
                    ->map(fn($r) => ['id' => $r->id, 'role_name' => $r->role_name, 'label' => self::ROLE_LABELS[$r->role_name] ?? $r->role_name])
                    ->sortBy(fn($r) => array_search($r['role_name'], self::CREATABLE_ROLES))->values(),
                'students' => Student::whereNull('user_id')->orderBy('full_name')->get(['id', 'full_name', 'nis', 'education_level', 'grade'])
                    ->map(fn($s) => ['id' => $s->id, 'name' => $s->full_name, 'nis' => $s->nis, 'level' => trim("{$s->education_level} {$s->grade}")]),
            ],
        ]);
    }

    /** * GET /users/{id} */
    public function show(string $id) {
        return response()->json(['success' => true, 'data' => $this->present($this->findUser($id))]);
    }

    /** * POST /users */
    public function store(Request $request) {
        $validated = $request->validate([
            'role_id'    => ['required', 'uuid', Rule::exists(Role::class, 'id')],
            'name'       => ['required', 'string', 'max:100'],
            'email'      => ['required', 'email', 'max:100', Rule::unique(User::class, 'email')],
            'phone'      => ['nullable', 'string', 'max:20', Rule::unique(User::class, 'phone')],
            'password'   => ['required', 'string', 'min:8'],
            'student_id' => ['nullable', 'uuid'],
        ], self::MESSAGES);

        $role = Role::findOrFail($validated['role_id']);
        if (!in_array($role->role_name, self::CREATABLE_ROLES, true)) {
            throw ValidationException::withMessages(['role_id' => 'Akun tentor & orang tua dibuat dari menu Tentor dan konversi Lead agar memiliki data profil.']);
        }
        $this->ensureCanManageRole($role->role_name);

        $user = DB::transaction(function () use ($validated, $role) {
            $student = null;
            if ($role->role_name === 'siswa') {
                if (empty($validated['student_id'])) {
                    throw ValidationException::withMessages(['student_id' => 'Pilih data siswa yang akan diberi akun login.']);
                }
                $student = Student::lockForUpdate()->find($validated['student_id']);
                if (!$student) {
                    throw ValidationException::withMessages(['student_id' => 'Data siswa tidak ditemukan.']);
                }
                if ($student->user_id) {
                    throw ValidationException::withMessages(['student_id' => 'Siswa ini sudah memiliki akun login.']);
                }
            }

            $user = User::create([
                'role_id'   => $role->id,
                'name'      => $validated['name'],
                'email'     => $validated['email'],
                'phone'     => $validated['phone'] ?? null,
                'password'  => Hash::make($validated['password']),
                'is_active' => true,
            ]);
            $student?->forceFill(['user_id' => $user->id])->save();

            return $user;
        });

        return response()->json(['success' => true, 'message' => 'Akun berhasil dibuat.', 'data' => $this->present($user->load(self::RELATIONS))], 201);
    }

    /** * PUT /users/{id} */
    public function update(Request $request, string $id) {
        $user = $this->findUser($id);
        $this->ensureCanManageRole($user->role?->role_name);

        $validated = $request->validate([
            'role_id' => ['required', 'uuid', Rule::exists(Role::class, 'id')],
            'name'    => ['required', 'string', 'max:100'],
            'email'   => ['required', 'email', 'max:100', Rule::unique(User::class, 'email')->ignore($user->id)],
            'phone'   => ['nullable', 'string', 'max:20', Rule::unique(User::class, 'phone')->ignore($user->id)],
        ], self::MESSAGES);

        // Peran hanya boleh berganti antar peran staf; akun tentor/ortu/siswa terikat profilnya
        $newRole = Role::findOrFail($validated['role_id']);
        if ($newRole->id !== $user->role_id) {
            if (!in_array($user->role?->role_name, self::STAFF_ROLES, true) || !in_array($newRole->role_name, self::STAFF_ROLES, true)) {
                throw ValidationException::withMessages(['role_id' => 'Peran akun tentor, orang tua, dan siswa tidak dapat diubah.']);
            }
            if ($user->id === Auth::id()) {
                throw ValidationException::withMessages(['role_id' => 'Anda tidak dapat mengubah peran akun Anda sendiri.']);
            }
            $this->ensureCanManageRole($newRole->role_name);
        }

        $user->update($validated);

        return response()->json(['success' => true, 'message' => 'Akun diperbarui.', 'data' => $this->present($user->fresh()->load(self::RELATIONS))]);
    }

    /** * PATCH /users/{id}/toggle */
    public function toggleStatus(string $id) {
        $user = $this->findUser($id);
        $this->ensureCanManageRole($user->role?->role_name);
        if ($user->id === Auth::id()) {
            throw ValidationException::withMessages(['user' => 'Anda tidak dapat menonaktifkan akun Anda sendiri.']);
        }

        $user->update(['is_active' => !$user->is_active]);
        // Akun nonaktif langsung keluar dari semua perangkat
        if (!$user->is_active) $user->tokens()->delete();

        return response()->json(['success' => true, 'message' => $user->is_active ? 'Akun diaktifkan.' : 'Akun dinonaktifkan dan dikeluarkan dari semua perangkat.', 'is_active' => $user->is_active]);
    }

    /** * PATCH /users/{id}/reset-password: buat password sementara */
    public function resetPassword(string $id) {
        $user = $this->findUser($id);
        $this->ensureCanManageRole($user->role?->role_name);
        if ($user->id === Auth::id()) {
            throw ValidationException::withMessages(['user' => 'Gunakan menu profil untuk mengganti password Anda sendiri.']);
        }

        $password = Str::password(10, symbols: false);
        $user->update(['password' => Hash::make($password)]);
        $user->tokens()->delete();

        return response()->json(['success' => true, 'message' => 'Password direset. Sampaikan password sementara ke pemilik akun.', 'temporary_password' => $password]);
    }

    /** * DELETE /users/{id} */
    public function destroy(string $id) {
        $user = $this->findUser($id);
        $this->ensureCanManageRole($user->role?->role_name);
        if ($user->id === Auth::id()) {
            throw ValidationException::withMessages(['user' => 'Anda tidak dapat menghapus akun Anda sendiri.']);
        }
        // Akun yang terikat profil dihapus dari menunya agar profil ikut tertangani
        if ($user->tentor || $user->parentProfile) {
            throw ValidationException::withMessages(['user' => 'Akun tentor / orang tua dihapus dari menu Tentor atau Orang Tua. Di sini Anda dapat menonaktifkannya.']);
        }

        SafeDelete::run(function () use ($user) {
            // Akun siswa: lepas tautan, data siswa tetap ada
            $user->student?->forceFill(['user_id' => null])->save();
            $user->tokens()->delete();
            $user->delete();
        }, 'Akun masih terhubung dengan data lain (artikel, pembayaran, dll.) sehingga tidak dapat dihapus. Nonaktifkan akun sebagai gantinya.');

        return response()->json(['success' => true, 'message' => 'Akun dihapus.']);
    }

    private function findUser(string $id): User {
        abort_unless(Str::isUuid($id), 404, 'Akun tidak ditemukan.');
        return User::with(self::RELATIONS)->findOrFail($id);
    }

    private function isSuperAdmin(): bool {
        return Auth::user()?->role?->role_name === 'super_admin';
    }

    private function ensureCanManageRole(?string $roleName): void {
        if ($roleName === 'super_admin' && !$this->isSuperAdmin()) {
            abort(403, 'Hanya Super Admin yang dapat mengelola akun Super Admin.');
        }
    }

    private function present(User $u): array {
        $roleName = $u->role?->role_name;
        $profile = match (true) {
            (bool) $u->tentor        => ['type' => 'tentor', 'name' => $u->name, 'detail' => $u->tentor->specialization],
            (bool) $u->parentProfile => ['type' => 'orang_tua', 'name' => $u->parentProfile->full_name, 'detail' => $u->parentProfile->relationship],
            (bool) $u->student       => ['type' => 'siswa', 'name' => $u->student->full_name, 'detail' => $u->student->nis],
            default                  => null,
        };

        return [
            'id'         => $u->id,
            'name'       => $u->name,
            'email'      => $u->email,
            'phone'      => $u->phone,
            'is_active'  => (bool) $u->is_active,
            'role_id'    => $u->role_id,
            'role_name'  => $roleName,
            'role_label' => self::ROLE_LABELS[$roleName] ?? $roleName,
            'profile'    => $profile,
            'is_self'    => $u->id === Auth::id(),
            'is_staff'   => in_array($roleName, self::STAFF_ROLES, true),
            'created_at' => LocalTime::format($u->created_at, 'Y-m-d H:i'),
        ];
    }

    private const MESSAGES = [
        'role_id.exists' => 'Peran tidak ditemukan.',
        'email.unique'   => 'Email sudah digunakan.',
        'phone.unique'   => 'Nomor HP sudah digunakan.',
        'password.min'   => 'Password minimal 8 karakter.',
    ];
}
