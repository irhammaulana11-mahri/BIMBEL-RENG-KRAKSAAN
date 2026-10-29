<?php

namespace Tests\Concerns;

use App\Models\Admin\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Testing\TestResponse;

/**
 * Data uji minimal: dua keluarga (A dan B) masing-masing dengan orang tua, siswa, tentor, kelas,
 * jadwal, satu sesi COMPLETED (5 Okt 2026), absensi HADIR, dan tagihan Oktober 2026 Rp 300.000 UNPAID.
 * Sama dengan fixture uji dinamis audit, agar hasil test bisa dibandingkan langsung.
 */
trait BuildsAuditFixtures
{
    protected const PASSWORD = 'Rahasia-Uji-1';

    /** @var array<string, string> */
    protected array $f = [];

    protected function buildAuditFixtures(): array {
        $now = now();
        $this->f['admin'] = $this->makeUser('Admin Uji', 'admin@uji.test', 'admin');
        $this->f['super'] = $this->makeUser('Super Admin Uji', 'super@uji.test', 'super_admin');

        foreach (['A', 'B'] as $k) {
            $this->f["pu$k"] = $this->makeUser("Ortu $k", "ortu$k@uji.test", 'orang_tua');
            $this->f["p$k"] = $this->insert('master.parents', ['user_id' => $this->f["pu$k"], 'full_name' => "Ortu $k"]);

            $this->f["su$k"] = $this->makeUser("Siswa $k", "siswa$k@uji.test", 'siswa');
            $this->f["s$k"] = $this->insert('master.students', ['user_id' => $this->f["su$k"], 'nis' => "UJI-$k", 'full_name' => "Siswa $k", 'is_active' => true]);
            $this->insert('master.parent_students', ['parent_id' => $this->f["p$k"], 'student_id' => $this->f["s$k"], 'created_at' => $now], false);

            $this->f["tu$k"] = $this->makeUser("Tentor $k", "tentor$k@uji.test", 'tentor');
            $this->f["t$k"] = $this->insert('master.tentors', ['user_id' => $this->f["tu$k"], 'is_active' => true]);
        }

        $this->f['subject'] = $this->insert('master.subjects', ['code' => 'UJI', 'name' => 'Mapel Uji']);

        foreach (['A', 'B'] as $k) {
            $this->f["c$k"] = $this->insert('academic.classes', ['name' => "Kelas $k", 'class_type' => 'REGULER', 'is_active' => true]);
            $this->insert('academic.class_students', ['class_id' => $this->f["c$k"], 'student_id' => $this->f["s$k"]]);
            $this->f["sch$k"] = $this->insert('academic.schedules', [
                'class_id' => $this->f["c$k"], 'subject_id' => $this->f['subject'], 'tentor_id' => $this->f["t$k"],
                'day_of_week' => 1, 'start_time' => '15:00', 'end_time' => '16:30',
            ]);
            $this->f["ss$k"] = $this->insert('academic.schedule_sessions', [
                'schedule_id' => $this->f["sch$k"], 'subject_id' => $this->f['subject'], 'tentor_id' => $this->f["t$k"],
                'day_of_week' => 1, 'meeting_no' => 1, 'session_date' => '2026-10-05',
                'start_time' => '15:00', 'end_time' => '16:30', 'status' => 'COMPLETED',
            ]);
            $this->insert('academic.student_attendances', ['session_id' => $this->f["ss$k"], 'student_id' => $this->f["s$k"], 'attendance_status' => 'HADIR']);
            $this->f["inv$k"] = $this->insert('finance.invoices', [
                'student_id' => $this->f["s$k"], 'class_id' => $this->f["c$k"], 'invoice_no' => "INV-UJI-$k",
                'issue_date' => '2026-10-01', 'due_date' => '2026-10-30', 'period_month' => 10, 'period_year' => 2026,
                'subtotal' => 300000, 'discount' => 0, 'total_amount' => 300000, 'paid_amount' => 0,
                'remaining_amount' => 300000, 'status' => 'UNPAID',
            ]);
        }

        return $this->f;
    }

    protected function makeUser(string $name, string $email, string $role): string {
        return $this->insert('master.users', [
            'role_id' => DB::table('master.roles')->where('role_name', $role)->value('id'),
            'name' => $name, 'email' => $email, 'password' => Hash::make(self::PASSWORD), 'is_active' => true,
        ]);
    }

    protected function insert(string $table, array $values, bool $timestamps = true): string {
        $id = (string) Str::uuid();
        if ($timestamps) $values += ['created_at' => now(), 'updated_at' => now()];
        DB::table($table)->insert(['id' => $id] + $values);
        return $id;
    }

    /** Token Sanctum asli, sama seperti hasil login. */
    protected function tokenFor(string $userId): string {
        return User::findOrFail($userId)->createToken('test')->plainTextToken;
    }

    /**
     * Permintaan API dengan token bearer. Guard dilupakan dulu agar user dari permintaan sebelumnya
     * (mis. sesi login lewat Auth::attempt) tidak terbawa, seperti pada server sungguhan.
     */
    protected function api(string $method, string $uri, ?string $token = null, array $data = [], array $server = []): TestResponse {
        $this->app['auth']->forgetGuards();
        $this->flushHeaders();
        $headers = ['Accept' => 'application/json'];
        if ($token) $headers['Authorization'] = "Bearer $token";
        return $this->withHeaders($headers)->withServerVariables($server)->json($method, '/api' . $uri, $data);
    }

    protected function login(string $email, string $password = self::PASSWORD, string $ip = '10.0.0.9'): TestResponse {
        return $this->api('POST', '/login', null, ['email' => $email, 'password' => $password], ['REMOTE_ADDR' => $ip]);
    }
}
