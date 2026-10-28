<?php

namespace App\Models\Admin;

use App\Models\Academic\ClassRoom;
use App\Models\Website\Package;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class StudentRegistrationRequest extends Model
{
    use HasUuids;

    protected $table = 'master.student_registration_requests';

    public const STATUSES = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];

    protected $fillable = [
        'parent_id', 'full_name', 'gender', 'birth_date', 'school_name',
        'education_level_id', 'package_id', 'note', 'login_email',
        'status', 'review_note', 'student_id', 'class_id', 'reviewed_by', 'reviewed_at',
    ];

    protected $casts = [
        'birth_date'  => 'date',
        'reviewed_at' => 'datetime',
    ];

    public function parent()
    {
        return $this->belongsTo(ParentModel::class, 'parent_id');
    }

    public function educationLevel()
    {
        return $this->belongsTo(EducationLevel::class, 'education_level_id');
    }

    public function package()
    {
        return $this->belongsTo(Package::class, 'package_id');
    }

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function classroom()
    {
        return $this->belongsTo(ClassRoom::class, 'class_id');
    }

    public function reviewer()
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
