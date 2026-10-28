<?php
namespace App\Services\Finance;

use App\Models\Academic\ClassRoom;
use App\Models\Academic\ScheduleSession;
use App\Models\Finance\FeeRule;
use Carbon\Carbon;
use Illuminate\Support\Collection;

/**
 * Rule Engine keuangan. Absensi hanya fakta; engine ini menerjemahkannya menjadi uang
 * memakai aturan tarif Admin yang TERPISAH untuk tagihan (BILLING) dan honor (PAYROLL).
 *
 * Pemilihan aturan per sesi: aktif, berlaku pada tanggal sesi, semua cakupan yang diisi cocok,
 * lalu yang paling spesifik (tentor > paket > jenjang > jenis kelas), kemudian yang paling baru berlaku.
 * Tanpa aturan yang cocok, dipakai perilaku lama (harga paket bulanan / tarif per sesi tentor).
 */
class FeeRuleEngine {

    public const LEGACY = 'LEGACY';

    /** @var array<string, Collection> aturan aktif per jenis, dimuat sekali per proses */
    private array $rules = [];

    public function findRule(string $type, array $context, string $date): ?FeeRule {
        $this->rules[$type] ??= FeeRule::where('rule_type', $type)->where('is_active', true)->get();

        return $this->rules[$type]
            ->filter(fn(FeeRule $r) =>
                $r->effective_from->toDateString() <= $date
                && (!$r->effective_to || $r->effective_to->toDateString() >= $date)
                && (!$r->class_type || $r->class_type === $context['class_type'])
                && (!$r->package_id || $r->package_id === $context['package_id'])
                && (!$r->education_level || $r->education_level === $context['education_level'])
                && (!$r->tentor_id || $r->tentor_id === ($context['tentor_id'] ?? null)))
            ->sortByDesc(fn(FeeRule $r) => sprintf('%02d|%s', $r->specificity(), $r->effective_from->toDateString()))
            ->first();
    }

    public static function context(?ClassRoom $class, ?string $tentorId = null): array {
        return [
            'class_type'      => strtoupper($class->class_type ?? 'REGULER'),
            'package_id'      => $class?->package_id,
            'education_level' => $class?->education_level ? strtoupper($class->education_level) : null,
            'tentor_id'       => $tentorId,
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | TAGIHAN WALI (per siswa per kelas per bulan)
    |--------------------------------------------------------------------------
    */

    /**
     * Baris tagihan satu siswa di satu kelas untuk satu bulan.
     * $sessions: sesi COMPLETED kelas pada bulan itu, dengan relasi studentAttendances.
     *
     * @return array{items: array, warning: ?string}
     */
    public function billingItems(ClassRoom $class, string $studentId, Collection $sessions, int $year, int $month): array {
        $periodStart = Carbon::create($year, $month, 1)->toDateString();
        $context = self::context($class);

        // Kelompokkan sesi per aturan yang berlaku di tanggal sesinya
        $groups = [];
        foreach ($sessions as $session) {
            $rule = $this->findRule('BILLING', $context, $session->session_date);
            $key = $rule?->id ?? self::LEGACY;
            $groups[$key] ??= ['rule' => $rule, 'sessions' => []];
            $groups[$key]['sessions'][] = $session;
        }

        // Bulan tanpa pertemuan selesai: hanya aturan bulanan (atau paket lama) yang menagih
        if (empty($groups)) {
            $rule = $this->findRule('BILLING', $context, $periodStart);
            if ($rule && $rule->method !== 'MONTHLY') {
                return ['items' => [], 'warning' => 'Belum ada pertemuan selesai pada periode ini.'];
            }
            $groups[$rule?->id ?? self::LEGACY] = ['rule' => $rule, 'sessions' => []];
        }

        $items = [];
        foreach ($groups as $group) {
            $item = $this->billingItem($class, $studentId, $group['rule'], collect($group['sessions']), $year, $month);
            if ($item) $items[] = $item;
        }

        if (empty($items)) {
            return ['items' => [], 'warning' => $class->package_id ? 'Tidak ada pertemuan yang ditagihkan.' : 'Tidak ada aturan tarif yang cocok dan kelas belum memiliki paket.'];
        }

        return ['items' => $items, 'warning' => null];
    }

    private function billingItem(ClassRoom $class, string $studentId, ?FeeRule $rule, Collection $sessions, int $year, int $month): ?array {
        $period = Carbon::create($year, $month, 1)->locale('id')->translatedFormat('F Y');

        // Perilaku lama: harga paket per bulan
        if (!$rule) {
            if (!$class->package) return null;
            return [
                'item_type'   => 'PACKAGE',
                'item_name'   => "{$class->package->package_name} - {$period}",
                'description' => "Kelas {$class->name} (harga paket bulanan)",
                'quantity'    => 1,
                'unit_price'  => (float) $class->package->default_price,
                'package_id'  => $class->package_id,
                'fee_rule_id' => null,
                'calc_method' => self::LEGACY,
            ];
        }

        $base = [
            'item_type'   => 'SERVICE',
            'unit_price'  => (float) $rule->amount,
            'package_id'  => $class->package_id,
            'fee_rule_id' => $rule->id,
            'calc_method' => $rule->method,
        ];

        if ($rule->method === 'MONTHLY') {
            return $base + [
                'item_name'   => "{$rule->name} - {$period}",
                'description' => "Kelas {$class->name} (tarif bulanan)",
                'quantity'    => 1,
            ];
        }

        $counted = $sessions->filter(fn($s) => $rule->counts($this->studentStatus($s, $studentId)));
        if ($counted->isEmpty()) return null;

        $dates = $counted->map(fn($s) => Carbon::parse($s->session_date)->format('d/m'))->join(', ');
        $statusNote = 'status ' . implode('/', $rule->counted_statuses ?: FeeRule::STUDENT_STATUSES);

        if ($rule->method === 'PER_HOUR') {
            $hours = round($counted->sum(fn($s) => $this->sessionMinutes($s)) / 60, 2);
            return $base + [
                'item_name'   => "{$rule->name} ({$hours} jam)",
                'description' => "Kelas {$class->name}, {$counted->count()} pertemuan {$statusNote}: {$dates}",
                'quantity'    => $hours,
            ];
        }

        // PER_MEETING (tagihan per siswa per pertemuan)
        return $base + [
            'item_name'   => "{$rule->name} ({$counted->count()} pertemuan)",
            'description' => "Kelas {$class->name}, {$statusNote}: {$dates}",
            'quantity'    => $counted->count(),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | HONOR TENTOR
    |--------------------------------------------------------------------------
    */

    /**
     * Rincian honor dari absensi tentor (HADIR, sesi selesai). Aturan bulanan menghasilkan
     * baris per sesi bernilai 0 (absensi tetap tercatat & terkunci) plus satu baris tetap per tentor.
     * $attendances: relasi tentor, session.schedule.classroom, session.studentAttendances.
     */
    public function payrollLines(Collection $attendances): Collection {
        $lines = collect();
        $monthly = [];

        foreach ($attendances as $att) {
            $session = $att->session;
            $class = $session->schedule?->classroom;
            $rule = $this->findRule('PAYROLL', self::context($class, $att->tentor_id), $session->session_date);
            $line = ['attendance' => $att, 'tentor' => $att->tentor, 'session' => $session,
                     'teaching_minutes' => (int) $att->teaching_minutes, 'rule' => $rule];

            if (!$rule) {
                $rate = (float) $att->tentor->rate_per_session;
                $lines->push($line + ['method' => self::LEGACY, 'quantity' => 1, 'unit_amount' => $rate, 'subtotal' => $rate,
                    'note' => 'Tarif per sesi tentor (tanpa aturan)']);
                continue;
            }

            $students = $session->studentAttendances;
            $countedStudents = $students->filter(fn($sa) => $rule->counts($sa->attendance_status))->count();
            $amount = (float) $rule->amount;

            [$quantity, $note] = match ($rule->method) {
                'PER_STUDENT' => [$countedStudents, "{$countedStudents} siswa terhitung"],
                // Pertemuan dibayar bila ada minimal satu siswa berstatus terhitung
                'PER_MEETING' => [$countedStudents > 0 || $students->isEmpty() ? 1 : 0,
                                  $countedStudents > 0 || $students->isEmpty() ? '1 pertemuan' : 'Tidak ada siswa berstatus terhitung'],
                'PER_HOUR'    => [$countedStudents > 0 || $students->isEmpty() ? round($att->teaching_minutes / 60, 2) : 0,
                                  round($att->teaching_minutes / 60, 2) . ' jam mengajar'],
                'MONTHLY'     => [0, 'Termasuk honor bulanan'],
            };

            if ($rule->method === 'MONTHLY') {
                $monthly[$att->tentor_id . '|' . $rule->id] ??= ['tentor' => $att->tentor, 'rule' => $rule];
            }

            $lines->push($line + [
                'method'      => $rule->method,
                'quantity'    => $quantity,
                'unit_amount' => $rule->method === 'MONTHLY' ? 0 : $amount,
                'subtotal'    => $rule->method === 'MONTHLY' ? 0 : round($quantity * $amount, 2),
                'note'        => "{$rule->name}: {$note}",
            ]);
        }

        foreach ($monthly as $m) {
            $lines->push([
                'attendance' => null, 'tentor' => $m['tentor'], 'session' => null, 'teaching_minutes' => 0,
                'rule' => $m['rule'], 'method' => 'MONTHLY', 'quantity' => 1,
                'unit_amount' => (float) $m['rule']->amount, 'subtotal' => (float) $m['rule']->amount,
                'note' => "{$m['rule']->name}: honor bulanan",
            ]);
        }

        return $lines;
    }

    private function studentStatus(ScheduleSession $session, string $studentId): ?string {
        return $session->studentAttendances->firstWhere('student_id', $studentId)?->attendance_status;
    }

    private function sessionMinutes(ScheduleSession $session): int {
        $start = Carbon::parse($session->start_time);
        $end = Carbon::parse($session->end_time);
        return $end->greaterThan($start) ? (int) $start->diffInMinutes($end) : 0;
    }
}
