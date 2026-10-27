<?php

namespace App\Models\Academic;

use App\Models\Admin\Student;
use App\Models\Admin\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ProgressReport extends Model
{
    use HasUuids;

    protected $table = 'academic.progress_reports';

    public const STATUSES = ['DRAFT', 'PUBLISHED'];

    protected $fillable = [
        'student_id', 'class_id', 'period_year', 'period_month', 'status',
        'general_note', 'snapshot', 'published_at', 'published_by', 'created_by',
    ];

    protected $casts = [
        'period_year'  => 'integer',
        'period_month' => 'integer',
        'snapshot'     => 'array',
        'published_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function classroom()
    {
        return $this->belongsTo(ClassRoom::class, 'class_id');
    }

    public function publisher()
    {
        return $this->belongsTo(User::class, 'published_by');
    }

    public function isPublished(): bool
    {
        return $this->status === 'PUBLISHED';
    }
}
