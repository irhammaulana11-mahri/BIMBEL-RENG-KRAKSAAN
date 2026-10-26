<?php

namespace App\Models\Exam;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Academic\ClassRoom;
use App\Models\Academic\SessionActivity;
use App\Models\Admin\Subject;
use App\Models\Admin\Tentor; // Sesuaikan dengan model Tentor Anda

class Exam extends Model
{
    use HasUuids;

    // Mendefinisikan schema dan nama tabel sesuai database PostgreSQL
    protected $table = 'exam.exams';

    public const STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];

    protected $fillable = [
        'subject_id',
        'tutor_id',
        'title',
        'description',
        'exam_date',
        'duration',
        'total_score',
        'status',
        'opens_at',
        'closes_at',
        'created_by',
    ];

    protected $casts = [
        'exam_date'   => 'date',
        'duration'    => 'integer',
        'total_score' => 'integer',
        'opens_at'    => 'datetime',
        'closes_at'   => 'datetime',
    ];

    // Relasi ke Mata Pelajaran (Subject)
    public function subject()
    {
        return $this->belongsTo(Subject::class, 'subject_id');
    }

    // Relasi ke Tentor (Tutor)
    public function tentor()
    {
        return $this->belongsTo(Tentor::class, 'tutor_id');
    }

    // Relasi ke Soal
    public function questions()
    {
        return $this->hasMany(Question::class, 'exam_id')->orderBy('order_no');
    }

    public function activeQuestions()
    {
        return $this->questions()->where('is_active', true);
    }

    public function results()
    {
        return $this->hasMany(ExamResult::class, 'exam_id');
    }

    // Kelas peserta ujian terjadwal
    public function classes()
    {
        return $this->belongsToMany(ClassRoom::class, 'exam.exam_classes', 'exam_id', 'class_id')
            ->withTimestamps();
    }

    // Aktivitas sesi yang memakai exam ini
    public function sessionActivities()
    {
        return $this->morphMany(SessionActivity::class, 'activityable');
    }

    public function isScheduled(): bool
    {
        return $this->opens_at !== null && $this->closes_at !== null;
    }
}
