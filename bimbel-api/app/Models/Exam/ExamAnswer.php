<?php

namespace App\Models\Exam;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ExamAnswer extends Model
{
    use HasUuids;

    protected $table = 'exam.exam_answers';

    protected $fillable = [
        'exam_result_id',
        'question_id',
        'answer',
        'is_correct',
        'score',
        'teacher_feedback',
        'ai_feedback',
        'graded_at',
    ];

    protected $casts = [
        'is_correct' => 'boolean',
        'score'      => 'decimal:2',
        'graded_at'  => 'datetime',
    ];

    public function result()
    {
        return $this->belongsTo(ExamResult::class, 'exam_result_id');
    }

    public function question()
    {
        return $this->belongsTo(Question::class, 'question_id');
    }
}
