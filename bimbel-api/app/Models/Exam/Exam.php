<?php

namespace App\Models\Exam;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Admin\Subject;
use App\Models\Admin\Tentor; // Sesuaikan dengan model Tentor Anda

class Exam extends Model
{
    use HasUuids;

    // Mendefinisikan schema dan nama tabel sesuai database PostgreSQL
    protected $table = 'exam.exams';

    protected $fillable = [
        'subject_id',
        'tutor_id',
        'title',
        'exam_date',
        'duration',
        'total_score',
    ];

    protected $casts = [
        'exam_date'   => 'date',
        'duration'    => 'integer',
        'total_score' => 'integer',
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
}