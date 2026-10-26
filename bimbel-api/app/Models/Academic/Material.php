<?php

namespace App\Models\Academic;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use App\Models\Admin\Tentor;

class Material extends Model
{
    use HasUuids;

    protected $table = 'academic.materials';
    
    protected $fillable = [
        'curriculum_id',
        'tentor_id',
        'title',
        'description',
        'material_type',
        'file_path',
        'video_url',
        'external_url',
        'duration_minutes',
        'sort_order',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'duration_minutes' => 'integer',
        'sort_order' => 'integer',
    ];

    public function curriculum()
    {
        return $this->belongsTo(Curriculum::class, 'curriculum_id');
    }

    public function tentor()
    {
        return $this->belongsTo(Tentor::class, 'tentor_id');
    }
}