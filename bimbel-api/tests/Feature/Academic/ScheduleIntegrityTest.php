<?php

namespace Tests\Feature\Academic;

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Tests\Concerns\BuildsAuditFixtures;
use Tests\TestCase;

/**
 * Jadwal: FK satu per kolom dengan ON DELETE RESTRICT (M-09) dan penghapusan jadwal yang tidak
 * menghilangkan sesi/absensi yang sudah berjalan (T10).
 */
class ScheduleIntegrityTest extends TestCase
{
    use BuildsAuditFixtures;

    protected function setUp(): void {
        parent::setUp();
        $this->buildAuditFixtures();
    }

    public function test_at72_fk_jadwal_satu_per_kolom_dan_restrict(): void {
        $fks = collect(DB::select("select (select attname from pg_attribute where attrelid = conrelid and attnum = conkey[1]) as col, confdeltype
            from pg_constraint where conrelid = 'academic.schedules'::regclass and contype = 'f'"));

        $this->assertEqualsCanonicalizing(['class_id', 'subject_id', 'tentor_id', 'learning_location_id'], $fks->pluck('col')->all());
        $this->assertSame(['r'], $fks->pluck('confdeltype')->unique()->values()->all());
    }

    public function test_at72_data_yang_dipakai_jadwal_tidak_bisa_dihapus(): void {
        $location = $this->insert('academic.learning_locations', ['location_name' => 'Ruang Uji', 'code' => 'RU1', 'is_active' => true]);
        DB::table('academic.schedules')->where('id', $this->f['schA'])->update(['learning_location_id' => $location]);

        foreach ([['academic.classes', $this->f['cA']], ['master.subjects', $this->f['subject']], ['master.tentors', $this->f['tA']], ['academic.learning_locations', $location]] as [$table, $id]) {
            try {
                DB::transaction(fn() => DB::table($table)->where('id', $id)->delete());
                $this->fail("Hapus $table seharusnya ditolak");
            } catch (QueryException $e) {
                $this->assertSame('23503', $e->errorInfo[0], $table);
            }
        }
        $this->assertDatabaseHas('academic.schedules', ['id' => $this->f['schA'], 'learning_location_id' => $location]);
    }

    public function test_jadwal_yang_sudah_berjalan_tidak_bisa_dihapus(): void {
        $this->api('DELETE', "/admin/schedules/{$this->f['schA']}", $this->tokenFor($this->f['admin']))->assertStatus(422);

        $this->assertDatabaseHas('academic.schedules', ['id' => $this->f['schA']]);
        $this->assertDatabaseHas('academic.student_attendances', ['session_id' => $this->f['ssA']]);
    }

    public function test_jadwal_yang_belum_berjalan_bisa_dihapus(): void {
        $schedule = $this->insert('academic.schedules', ['class_id' => $this->f['cA'], 'subject_id' => $this->f['subject'], 'tentor_id' => $this->f['tA'],
            'day_of_week' => 3, 'start_time' => '08:00', 'end_time' => '09:00']);
        $session = $this->insert('academic.schedule_sessions', ['schedule_id' => $schedule, 'subject_id' => $this->f['subject'], 'tentor_id' => $this->f['tA'],
            'day_of_week' => 3, 'meeting_no' => 1, 'session_date' => '2026-11-04', 'start_time' => '08:00', 'end_time' => '09:00', 'status' => 'SCHEDULED']);

        $this->api('DELETE', "/admin/schedules/$schedule", $this->tokenFor($this->f['admin']))->assertOk();

        $this->assertDatabaseMissing('academic.schedules', ['id' => $schedule]);
        $this->assertDatabaseMissing('academic.schedule_sessions', ['id' => $session]);
    }
}
