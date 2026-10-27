<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\Role;
use App\Models\Admin\User;
use App\Support\SafeDelete;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /** * GET /users */
    public function index() {
        return response()->json(User::with('role')->orderBy('name')->get());
    }

    /** * GET /users/{id} */
    public function show(string $id) {
        return response()->json(User::with('role')->findOrFail($id));
    }

    /** * POST /users */
    public function store(Request $request) {
        $validated = $request->validate([
            'role_id'  => ['required', 'uuid', Rule::exists(Role::class, 'id')],
            'name'     => ['required', 'string', 'max:100'],
            'email'    => ['required', 'email', 'max:100', Rule::unique(User::class, 'email')],
            'phone'    => ['nullable', 'string', 'max:20', Rule::unique(User::class, 'phone')],
            'password' => ['required', 'string', 'min:8'],
        ], self::MESSAGES);

        $validated['password'] = Hash::make($validated['password']);
        $user = User::create($validated);

        return response()->json(['success' => true, 'data' => $user->load('role')], 201);
    }

    /** * PUT /users/{id} */
    public function update(Request $request, string $id) {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'role_id'   => ['required', 'uuid', Rule::exists(Role::class, 'id')],
            'name'      => ['required', 'string', 'max:100'],
            'email'     => ['required', 'email', 'max:100', Rule::unique(User::class, 'email')->ignore($user->id)],
            'phone'     => ['nullable', 'string', 'max:20', Rule::unique(User::class, 'phone')->ignore($user->id)],
            'is_active' => ['boolean'],
            'password'  => ['nullable', 'string', 'min:8'],
        ], self::MESSAGES);

        // Admin tidak boleh menonaktifkan / menurunkan perannya sendiri
        if ($user->id === Auth::id() && (($validated['is_active'] ?? true) === false || $validated['role_id'] !== $user->role_id)) {
            throw ValidationException::withMessages(['role_id' => 'Anda tidak dapat menonaktifkan atau mengubah peran akun Anda sendiri.']);
        }

        if (!empty($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        } else {
            unset($validated['password']);
        }

        $user->update($validated);

        return response()->json(['success' => true, 'data' => $user->fresh()->load('role')]);
    }

    /** * DELETE /users/{id} */
    public function destroy(string $id) {
        $user = User::findOrFail($id);
        if ($user->id === Auth::id()) {
            throw ValidationException::withMessages(['user' => 'Anda tidak dapat menghapus akun Anda sendiri.']);
        }

        SafeDelete::run(fn() => $user->delete(),
            'Akun masih terhubung dengan data lain (artikel, pembayaran, data tentor/siswa/orang tua) sehingga tidak dapat dihapus. Nonaktifkan akun sebagai gantinya.');

        return response()->json(['success' => true]);
    }

    private const MESSAGES = [
        'role_id.exists' => 'Peran tidak ditemukan.',
        'email.unique'   => 'Email sudah digunakan.',
        'phone.unique'   => 'Nomor HP sudah digunakan.',
        'password.min'   => 'Password minimal 8 karakter.',
    ];
}
