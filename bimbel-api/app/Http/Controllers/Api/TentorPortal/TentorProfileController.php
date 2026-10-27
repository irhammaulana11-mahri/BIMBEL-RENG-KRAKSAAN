<?php
namespace App\Http\Controllers\Api\TentorPortal;

use App\Http\Controllers\Controller;
use App\Http\Requests\Account\UpdatePasswordRequest;
use App\Http\Requests\Tentor\TentorProfileRequest;
use App\Services\Account\PasswordService;
use App\Services\Tentor\TentorPortalService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

/**
 * Profil tentor & daftar murid di kelas yang diajarnya.
 */
class TentorProfileController extends Controller {

    public function __construct(protected TentorPortalService $portal) {}

    public function show() {
        return response()->json(['success' => true, 'data' => $this->portal->profile($this->portal->currentTentor())]);
    }

    public function update(TentorProfileRequest $request) {
        $tentor = $this->portal->currentTentor();
        $data = $request->validated();

        DB::transaction(function () use ($tentor, $data) {
            $tentor->update(['address' => $data['address'] ?? null]);
            $tentor->user->update(['phone' => $data['phone'] ?? null]);
        });

        return response()->json(['success' => true, 'message' => 'Profil diperbarui.']);
    }

    public function updatePassword(UpdatePasswordRequest $request, PasswordService $passwords) {
        $passwords->change(Auth::user(), $request->password);

        return response()->json(['success' => true, 'message' => 'Password diperbarui. Sesi di perangkat lain telah dikeluarkan.']);
    }

    public function students(Request $request) {
        $request->validate([
            'class_id' => ['nullable', 'uuid'],
            'keyword'  => ['nullable', 'string', 'max:100'],
        ]);

        return response()->json(['success' => true] + $this->portal->students($this->portal->currentTentor(), $request->only(['class_id', 'keyword'])));
    }
}
