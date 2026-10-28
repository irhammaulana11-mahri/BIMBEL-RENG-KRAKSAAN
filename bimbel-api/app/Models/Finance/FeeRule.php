<?php

namespace App\Models\Finance;

use App\Models\Admin\Tentor;
use App\Models\Website\Package;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

/**
 * Aturan tarif Rule Engine: BILLING (tagihan wali) atau PAYROLL (honor tentor).
 * Cakupan (jenis kelas, paket, jenjang, tentor) opsional; aturan paling spesifik yang dipakai.
 */
class FeeRule extends Model
{
    use HasUuids;

    protected $table = 'finance.fee_rules';

    public const TYPES = ['BILLING', 'PAYROLL'];

    // Metode yang tersedia per jenis aturan
    public const METHODS = [
        'BILLING' => ['PER_MEETING', 'PER_HOUR', 'MONTHLY'],
        'PAYROLL' => ['PER_STUDENT', 'PER_MEETING', 'PER_HOUR', 'MONTHLY'],
    ];

    public const METHOD_LABELS = [
        'PER_STUDENT' => 'Per siswa terhitung per sesi',
        'PER_MEETING' => 'Per pertemuan',
        'PER_HOUR'    => 'Per jam',
        'MONTHLY'     => 'Bulanan (tetap)',
    ];

    public const STUDENT_STATUSES = ['HADIR', 'IZIN', 'SAKIT', 'ALPA'];

    protected $fillable = [
        'rule_type', 'name', 'class_type', 'package_id', 'education_level', 'tentor_id',
        'method', 'amount', 'counted_statuses', 'effective_from', 'effective_to', 'is_active', 'note', 'created_by',
    ];

    protected $casts = [
        'amount'           => 'decimal:2',
        'counted_statuses' => 'array',
        'effective_from'   => 'date',
        'effective_to'     => 'date',
        'is_active'        => 'boolean',
    ];

    public function package() { return $this->belongsTo(Package::class, 'package_id'); }
    public function tentor() { return $this->belongsTo(Tentor::class, 'tentor_id'); }

    // Status kosong = semua status kehadiran dihitung
    public function counts(?string $status): bool {
        $statuses = $this->counted_statuses ?: self::STUDENT_STATUSES;
        return $status !== null && in_array($status, $statuses, true);
    }

    // Bobot kespesifikan: tentor > paket > jenjang > jenis kelas
    public function specificity(): int {
        return ($this->tentor_id ? 8 : 0) + ($this->package_id ? 4 : 0)
            + ($this->education_level ? 2 : 0) + ($this->class_type ? 1 : 0);
    }
}
