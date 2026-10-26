<?php

namespace App\Models\Exam;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Question extends Model
{
    use HasUuids;

    protected $table = 'exam.questions';

    protected $fillable = [
        'exam_id',
        'question_type',
        'question',
        'option_a',
        'option_b',
        'option_c',
        'option_d',
        'option_e',
        'correct_answer',
        'essay_answer',
        'score',
        'order_no',
        'is_active',
    ];

    protected $casts = [
        'score'     => 'integer',
        'order_no'  => 'integer',
        'is_active' => 'boolean',
    ];

    public function exam()
    {
        return $this->belongsTo(Exam::class, 'exam_id');
    }
}
