<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * academic.schedules punya dua FK untuk setiap kolom class/subject/tentor/learning_location (sisa skema
     * lama + migration baru) dengan aturan ON DELETE berbeda. Diuji di bimbel_test (2026-10-29): FK NO ACTION
     * lama sudah menahan penghapusan, jadi perilaku efektifnya RESTRICT. Delapan FK diganti empat FK
     * ON DELETE RESTRICT, satu per kolom; perilaku tidak berubah, definisinya tidak lagi bertentangan.
     */
    private const OLD = [
        'fk_schedule_class'              => 'FOREIGN KEY (class_id) REFERENCES academic.classes(id)',
        'fk_schedule_location'           => 'FOREIGN KEY (learning_location_id) REFERENCES academic.learning_locations(id)',
        'fk_schedule_subject'            => 'FOREIGN KEY (subject_id) REFERENCES master.subjects(id)',
        'fk_schedule_tutor'              => 'FOREIGN KEY (tentor_id) REFERENCES master.tentors(id)',
        'fk_schedules_class'             => 'FOREIGN KEY (class_id) REFERENCES academic.classes(id) ON DELETE CASCADE',
        'fk_schedules_learning_location' => 'FOREIGN KEY (learning_location_id) REFERENCES academic.learning_locations(id) ON DELETE SET NULL',
        'fk_schedules_subject'           => 'FOREIGN KEY (subject_id) REFERENCES master.subjects(id) ON DELETE RESTRICT',
        'fk_schedules_tentor'            => 'FOREIGN KEY (tentor_id) REFERENCES master.tentors(id) ON DELETE RESTRICT',
    ];

    private const NEW = [
        'fk_schedules_class'             => 'FOREIGN KEY (class_id) REFERENCES academic.classes(id) ON DELETE RESTRICT',
        'fk_schedules_subject'           => 'FOREIGN KEY (subject_id) REFERENCES master.subjects(id) ON DELETE RESTRICT',
        'fk_schedules_tentor'            => 'FOREIGN KEY (tentor_id) REFERENCES master.tentors(id) ON DELETE RESTRICT',
        'fk_schedules_learning_location' => 'FOREIGN KEY (learning_location_id) REFERENCES academic.learning_locations(id) ON DELETE RESTRICT',
    ];

    public function up(): void
    {
        $this->replace(self::OLD, self::NEW);
    }

    public function down(): void
    {
        $this->replace(self::NEW, self::OLD);
    }

    private function replace(array $from, array $to): void
    {
        foreach (array_keys($from) as $name) {
            DB::statement("ALTER TABLE academic.schedules DROP CONSTRAINT IF EXISTS {$name}");
        }
        foreach ($to as $name => $definition) {
            DB::statement("ALTER TABLE academic.schedules ADD CONSTRAINT {$name} {$definition}");
        }
    }
};
