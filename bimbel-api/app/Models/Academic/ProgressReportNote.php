<?php

namespace App\Models\Academic;

use App\Models\Admin\Student;
use App\Models\Admin\Subject;
use App\Models\Admin\Tentor;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ProgressReportNote extends Model
{
    use HasUuids;

    protected $table = 'academic.progress_report_notes';

    protected $fillable = [
        'student_id', 'class_id', 'subject_id', 'tentor_id', 'period_year', 'period_month', 'note',
    ];

    protected $casts = [
        'period_year'  => 'integer',
        'period_month' => 'integer',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class, 'student_id');
    }

    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    public function tentor()
    {
        return $this->belongsTo(Tentor::class, 'tentor_id');
    }
}
