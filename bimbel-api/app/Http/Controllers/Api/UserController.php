<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
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
            'role_id' => 'required|uuid',
            'name' => 'required|max:100',
            'email' => ['required','email',Rule::unique('users', 'email')],
            'phone' => 'nullable|max:20',
            'password' => 'required|min:6'
        ]);

        $validated['password'] =
            Hash::make($validated['password']);

        $user = User::create($validated);

        return response()->json([
            'success' => true,
            'data' => $user
        ],201);
    }

    /** * PUT /users/{id} */
    public function update(Request $request,string $id) {
        $user = User::findOrFail($id);

        $validated = $request->validate([
            'role_id' => 'required|uuid',
            'name' => 'required|max:100',
            'email' => 'required|email',
            'phone' => 'nullable|max:20',
            'is_active' => 'boolean'
        ]);

        $user->update($validated);

        return response()->json([
            'success' => true,
            'data' => $user
        ]);
    }

    /** * DELETE /users/{id} */
    public function destroy(string $id) {
        User::findOrFail($id)->delete();

        return response()->json(['success' => true]);
    }
}
