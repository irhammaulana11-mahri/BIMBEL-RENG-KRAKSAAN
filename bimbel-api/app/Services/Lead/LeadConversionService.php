<?php

namespace App\Services\Lead;

use App\Models\Admin\ParentModel;
use App\Models\Admin\Role;
use App\Models\Admin\User;
use App\Models\Website\Lead;
use App\Services\Student\StudentRegistrationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class LeadConversionService {
    public function __construct(
        protected StudentRegistrationService $studentService
    ) {}

    public function convert(Lead $lead): array {
        if ($lead->status === 'REGISTERED') {
            throw ValidationException::withMessages([
                'lead' => 'Lead sudah terdaftar.'
            ]);
        }

        if ($lead->status !== 'CONTACTED') {
            throw ValidationException::withMessages([
                'lead' => 'Lead harus di callback terlebih dahulu dan diupdate status menjadi "Contacted".'
            ]);
        }

        $role = Role::where('role_name', 'orang_tua')->firstOrFail();

        return DB::transaction(function () use ($lead, $role) {

            if (User::where('phone', $lead->phone)->exists()) {
                throw ValidationException::withMessages([
                    'phone' => 'Nomor HP sudah digunakan pada akun lainnya.'
                ]);
            }

            $password = str()->password(8);

            $user = User::create([
                'role_id' => $role->id,
                'name' => $lead->parent_name,
                'email' => $lead->email,
                'phone' => $lead->phone,
                'password' => Hash::make($password),
                'is_active' => true,
            ]);

            $parent = ParentModel::create([
                'user_id' => $user->id,
                'full_name' => $lead->parent_name,
                'relationship' => 'Orang Tua',
            ]);

            $student = $this->studentService->register(
                $parent,
                [
                    'full_name' => $lead->student_name,
                    'education_level' => $lead->education_level,
                ]
            );

            $lead->update([
                'status' => 'REGISTERED',
            ]);

            return [
                'user' => $user,
                'parent' => $parent,
                'student' => $student,
                'password' => $password,
            ];
        });
    }
}