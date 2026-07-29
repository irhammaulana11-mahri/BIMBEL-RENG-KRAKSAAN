<?php

namespace App\Services\Student;

use App\Models\Admin\ParentModel;
use App\Models\Admin\ParentStudent;
use App\Models\Admin\Student;
use Illuminate\Support\Facades\DB;

class StudentRegistrationService {
    public function __construct(
        protected NisGenerator $nisGenerator
    ) {}

    public function register(ParentModel $parent,array $data): Student {

        return DB::transaction(function () use (
            $parent,
            $data
        ) {

            $student = Student::create([
                'user_id' => $data['user_id'] ?? null,
                'full_name'        => $data['full_name'],
                'nis'              => $this->nisGenerator->generate(),
                'gender'           => $data['gender'] ?? null,
                'birth_date'       => $data['birth_date'] ?? null,
                'education_level'  => $data['education_level'] ?? null,
                'school_name'      => $data['school_name'] ?? null,
                'grade'            => $data['grade'] ?? null,
                'address'          => $data['address'] ?? null,
                'latitude'         => $data['latitude'] ?? null,
                'longitude'        => $data['longitude'] ?? null,
                'photo'            => $data['photo'] ?? null,
                'is_active'        => true,
            ]);

            ParentStudent::create([
                'parent_id' => $parent->id,
                'student_id' => $student->id,

            ]);

            return $student->load([
                'user',
                'parents.user',
            ]);

        });

    }
}