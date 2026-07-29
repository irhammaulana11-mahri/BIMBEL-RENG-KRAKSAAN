<?php

namespace App\Models\Admin;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Admin\Tentor;

class TentorSubject extends Model {
    use HasUuids;
    protected $table = 'master.tentor_subjects';
    public $incrementing = false;
    protected $keyType = 'string';
    protected $fillable = ['tentor_id','subject_id'];

    public function tentor() {
        return $this->belongsTo(Tentor::class);
    }

    public function subject() {
        return $this->belongsTo(Subject::class);
    }
}