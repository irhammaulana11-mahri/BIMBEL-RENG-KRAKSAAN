<?php

namespace App\Http\Controllers\Api\Website;

use App\Models\Website\Lead;
use App\Http\Controllers\Controller;
use App\Http\Requests\Website\LeadRequest;
use App\Http\Resources\Website\LeadResource;
use App\Models\Admin\User;
use App\Models\Admin\ParentModel;
use App\Models\Admin\Role;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class LeadController extends Controller {
    public function index() {
        return LeadResource::collection(
            Lead::with('package')
                ->latest()
                ->get()
        );
    }

    public function store(LeadRequest $request)
    {
        $data = $request->validated();
        $data['status'] = 'NEW';
        $lead = Lead::create($data);
        return new LeadResource(
            $lead->load('package')
        );
    }

    public function show(Lead $lead) {
        return new LeadResource($lead->load('package'));
    }

    public function update(LeadRequest $request,Lead $lead) {
        $lead->update($request->validated());
        return new LeadResource(
            $lead->fresh()->load('package')
        );
    }

    public function destroy(Lead $lead) {
        $lead->delete();
        return response()->json(['message' => 'Deleted successfully']);
    }

    public function convert(Lead $lead)
    {
        $existingUser = User::where('phone',$lead->phone)->first();

        if ($existingUser) {
            return response()->json(['message' =>'Nomor WhatsApp sudah terdaftar'], 422);
        }

        if ($lead->status === 'REGISTERED') {
            return response()->json(['message' => 'Lead sudah dikonversi'], 422);
        }

        DB::beginTransaction();

        try {
            if ($lead->status !== 'CONTACTED') {
                return response()->json(['message' => 'Lead harus berstatus CONTACTED'], 422);
}
            $parentRole = Role::where('role_name','orang_tua')->first();

            if (!$parentRole) {
                throw new \Exception('Role parent tidak ditemukan');
            }

            $password = Str::random(8);

            $user = User::create([
                'role_id' => $parentRole->id,
                'name' => $lead->parent_name,
                'phone' => $lead->phone,
                'email' => null,
                'password' => Hash::make($password),
                'is_active' => true,
            ]);

            $parent = ParentModel::create([
                'user_id' => $user->id,
                'full_name' => $lead->parent_name,
                'occupation' => null,
                'relationship' => 'Orang Tua',
                'address' => null,
            ]);

            $lead->update([
                'status' => 'REGISTERED',
                'user_id' => $user->id,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Lead berhasil dikonversi',
                'user_id' => $user->id,
                'parent_id' => $parent->id,

                // sementara tampilkan password
                // nanti bisa dikirim WA
                'temporary_password' => $password
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => $e->getMessage()
            ], 500);
        }
    }
}