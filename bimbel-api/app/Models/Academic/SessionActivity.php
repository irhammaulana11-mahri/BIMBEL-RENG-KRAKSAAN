<?php
namespace App\Models\Academic;

use App\Models\Admin\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class SessionActivity extends Model {
    use HasUuids;
    protected $table = 'academic.session_activities';

    public const TYPES = ['MATERIAL', 'EXAM', 'DISCUSSION', 'REVIEW'];
    public const STATUSES = ['DRAFT', 'READY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

    protected $fillable = [
        'schedule_session_id', 'activity_type', 'title', 'description',
        'activityable_type', 'activityable_id', 'display_order',
        'status', 'start_time', 'end_time', 'started_at', 'completed_at',
        'note', 'created_by', 'updated_by'
    ];

    protected $casts = [
        'display_order' => 'integer',
        'started_at'    => 'datetime',
        'completed_at'  => 'datetime',
    ];

    /**
     * Relasi balik ke Schedule Session
     */
    public function session() {
        return $this->belongsTo(ScheduleSession::class, 'schedule_session_id');
    }

    /**
     * Polymorphic Relation ke target aktivitas (material / exam), alias di AppServiceProvider
     */
    public function activityable() {
        return $this->morphTo();
    }

    // Hasil ujian siswa untuk aktivitas EXAM
    public function examResults() {
        return $this->hasMany(\App\Models\Exam\ExamResult::class, 'session_activity_id');
    }

    public function creator() {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function updater() {
        return $this->belongsTo(User::class, 'updated_by');
    }
}
