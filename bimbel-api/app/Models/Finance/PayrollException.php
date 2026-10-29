<?php

namespace App\Models\Finance;

use App\Models\Academic\ScheduleSession;
use App\Models\Academic\TentorAttendance;
use App\Models\Admin\Tentor;
use App\Models\Admin\User;
use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

/**
 * Absensi tentor HADIR dari periode lalu yang belum masuk payroll (D-05). Tidak dibayar otomatis:
 * harus ditinjau (APPROVED) dulu, lalu ikut payroll berikutnya yang disusun.
 */
class PayrollException extends Model
{
    use HasUuids;

    protected $table = 'finance.payroll_exceptions';

    public const STATUSES = ['OPEN', 'APPROVED', 'REJECTED'];

    protected $fillable = [
        'tentor_attendance_id', 'session_id', 'tentor_id', 'origin_year', 'origin_month', 'checks',
        'status', 'reviewed_by', 'reviewed_at', 'note', 'self_approved', 'target_payroll_id',
    ];

    protected $casts = [
        'checks'        => 'array',
        'origin_year'   => 'integer',
        'origin_month'  => 'integer',
        'self_approved' => 'boolean',
        'reviewed_at'   => 'datetime',
    ];

    public function attendance() { return $this->belongsTo(TentorAttendance::class, 'tentor_attendance_id'); }
    public function session() { return $this->belongsTo(ScheduleSession::class, 'session_id'); }
    public function tentor() { return $this->belongsTo(Tentor::class, 'tentor_id'); }
    public function reviewer() { return $this->belongsTo(User::class, 'reviewed_by'); }
    public function targetPayroll() { return $this->belongsTo(Payroll::class, 'target_payroll_id'); }

    /** Semua pemeriksaan wajib lulus sebelum boleh disetujui */
    public function checksPassed(): bool {
        return collect($this->checks ?? [])->every(fn($c) => $c['ok'] || !($c['blocking'] ?? true));
    }
}
