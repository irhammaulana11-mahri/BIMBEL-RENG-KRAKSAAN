<?php
namespace App\Services\Academic;

use App\Models\Academic\Curriculum;
use App\Models\Academic\Material;
use App\Models\Academic\ScheduleSession;
use App\Models\Academic\SessionActivity;
use App\Models\Exam\Exam;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SessionActivityService {

    // Sesi yang sudah tidak bisa diubah aktivitasnya
    private const LOCKED_SESSION_STATUSES = ['COMPLETED', 'CANCELLED'];

    /**
     * Tambah aktivitas ke sesi. activityable diturunkan dari activity_type:
     * MATERIAL -> material (wajib), EXAM -> exam (wajib), REVIEW -> material (opsional), DISCUSSION -> tanpa referensi.
     */
    public function create(ScheduleSession $session, array $data): SessionActivity {
        $this->ensureSessionEditable($session);

        $type = strtoupper($data['activity_type']);
        $reference = $this->resolveReference($session, $type, $data['activityable_id'] ?? null);

        return DB::transaction(function () use ($session, $data, $type, $reference) {
            // Kunci baris sesi agar display_order tidak bentrok saat tambah bersamaan
            ScheduleSession::whereKey($session->id)->lockForUpdate()->first();
            $lastOrder = SessionActivity::where('schedule_session_id', $session->id)->max('display_order') ?? 0;

            return SessionActivity::create([
                'schedule_session_id' => $session->id,
                'activity_type'       => $type,
                'title'               => $data['title'],
                'description'         => $data['description'] ?? null,
                'activityable_type'   => $reference['type'],
                'activityable_id'     => $reference['id'],
                'start_time'          => $data['start_time'] ?? null,
                'end_time'            => $data['end_time'] ?? null,
                'note'                => $data['note'] ?? null,
                'display_order'       => $data['display_order'] ?? $lastOrder + 1,
                'status'              => $data['status'] ?? 'READY',
                'created_by'          => Auth::id(),
                'updated_by'          => Auth::id(),
            ]);
        });
    }

    public function update(SessionActivity $activity, array $data): SessionActivity {
        $session = $activity->session;
        $this->ensureSessionEditable($session);

        if (in_array($activity->status, ['COMPLETED', 'CANCELLED'])) {
            throw ValidationException::withMessages(['status' => ['Aktivitas yang sudah selesai atau dibatalkan tidak dapat diubah.']]);
        }

        $type = strtoupper($data['activity_type'] ?? $activity->activity_type);
        $reference = $this->resolveReference($session, $type, array_key_exists('activityable_id', $data) ? $data['activityable_id'] : $activity->activityable_id);

        $activity->update(array_merge(
            collect($data)->only(['title', 'description', 'start_time', 'end_time', 'note', 'display_order'])->all(),
            [
                'activity_type'     => $type,
                'activityable_type' => $reference['type'],
                'activityable_id'   => $reference['id'],
                'updated_by'        => Auth::id(),
            ]
        ));

        return $activity->refresh();
    }

    public function start(SessionActivity $activity): SessionActivity {
        $session = $activity->session;

        if ($session->status !== 'IN_PROGRESS') {
            throw ValidationException::withMessages(['status' => ['Aktivitas hanya dapat dimulai saat sesi sedang berlangsung.']]);
        }

        if (!in_array($activity->status, ['DRAFT', 'READY'])) {
            throw ValidationException::withMessages(['status' => ['Aktivitas ini tidak dapat dimulai.']]);
        }

        $running = SessionActivity::where('schedule_session_id', $session->id)
            ->where('status', 'IN_PROGRESS')
            ->exists();

        if ($running) {
            throw ValidationException::withMessages(['status' => ['Selesaikan aktivitas yang sedang berjalan terlebih dahulu.']]);
        }

        $activity->update([
            'status'     => 'IN_PROGRESS',
            'started_at' => now(),
            'updated_by' => Auth::id(),
        ]);

        return $activity->refresh();
    }

    public function complete(SessionActivity $activity): SessionActivity {
        if ($activity->status !== 'IN_PROGRESS') {
            throw ValidationException::withMessages(['status' => ['Hanya aktivitas yang sedang berjalan yang dapat diselesaikan.']]);
        }

        $activity->update([
            'status'       => 'COMPLETED',
            'completed_at' => now(),
            'updated_by'   => Auth::id(),
        ]);

        return $activity->refresh();
    }

    public function cancel(SessionActivity $activity): SessionActivity {
        $this->ensureSessionEditable($activity->session);

        if (in_array($activity->status, ['COMPLETED', 'CANCELLED'])) {
            throw ValidationException::withMessages(['status' => ['Aktivitas yang sudah selesai atau dibatalkan tidak dapat dibatalkan.']]);
        }

        $activity->update(['status' => 'CANCELLED', 'updated_by' => Auth::id()]);

        return $activity->refresh();
    }

    public function delete(SessionActivity $activity): void {
        $this->ensureSessionEditable($activity->session);

        if (!in_array($activity->status, ['DRAFT', 'READY'])) {
            throw ValidationException::withMessages(['status' => ['Aktivitas yang sedang atau sudah dijalankan tidak dapat dihapus.']]);
        }

        DB::transaction(function () use ($activity) {
            $sessionId = $activity->schedule_session_id;
            $activity->delete();
            $this->normalizeOrder($sessionId);
        });
    }

    /**
     * Susun ulang urutan aktivitas. $orderedIds harus berisi seluruh aktivitas sesi.
     */
    public function reorder(ScheduleSession $session, array $orderedIds): void {
        $this->ensureSessionEditable($session);

        $currentIds = SessionActivity::where('schedule_session_id', $session->id)->pluck('id');

        if ($currentIds->count() !== count($orderedIds) || $currentIds->diff($orderedIds)->isNotEmpty()) {
            throw ValidationException::withMessages(['activity_ids' => ['Daftar aktivitas tidak sesuai dengan aktivitas pada sesi ini.']]);
        }

        DB::transaction(function () use ($orderedIds) {
            foreach (array_values($orderedIds) as $index => $id) {
                SessionActivity::whereKey($id)->update(['display_order' => $index + 1, 'updated_by' => Auth::id()]);
            }
        });
    }

    public function hasRunningActivity(ScheduleSession $session): bool {
        return SessionActivity::where('schedule_session_id', $session->id)
            ->where('status', 'IN_PROGRESS')
            ->exists();
    }

    private function normalizeOrder(string $sessionId): void {
        SessionActivity::where('schedule_session_id', $sessionId)
            ->orderBy('display_order')
            ->orderBy('created_at')
            ->get()
            ->each(fn($act, $index) => $act->display_order !== $index + 1
                ? $act->update(['display_order' => $index + 1])
                : null);
    }

    private function ensureSessionEditable(ScheduleSession $session): void {
        if (in_array($session->status, self::LOCKED_SESSION_STATUSES)) {
            throw ValidationException::withMessages(['status' => ['Aktivitas pada sesi yang sudah selesai atau dibatalkan tidak dapat diubah.']]);
        }
    }

    /**
     * Validasi referensi aktivitas dan kembalikan pasangan [type alias, id].
     * Materi harus berasal dari kurikulum mapel sesi; exam harus untuk mapel sesi.
     */
    private function resolveReference(ScheduleSession $session, string $type, ?string $referenceId): array {
        if (!in_array($type, SessionActivity::TYPES)) {
            throw ValidationException::withMessages(['activity_type' => ['Jenis aktivitas tidak valid.']]);
        }

        if ($type === 'DISCUSSION') {
            return ['type' => null, 'id' => null];
        }

        if (empty($referenceId)) {
            if ($type === 'REVIEW') return ['type' => null, 'id' => null];

            $label = $type === 'MATERIAL' ? 'Materi' : 'Exam';
            throw ValidationException::withMessages(['activityable_id' => ["{$label} wajib dipilih untuk aktivitas {$type}."]]);
        }

        if ($type === 'EXAM') {
            $exam = Exam::whereKey($referenceId)->where('subject_id', $session->subject_id)->first();
            if (!$exam) {
                throw ValidationException::withMessages(['activityable_id' => ['Exam tidak ditemukan untuk mata pelajaran sesi ini.']]);
            }
            if ($exam->status !== 'PUBLISHED') {
                throw ValidationException::withMessages(['activityable_id' => ['Exam belum diterbitkan oleh Admin.']]);
            }
            return ['type' => 'exam', 'id' => $referenceId];
        }

        // MATERIAL / REVIEW -> materi dari kurikulum mapel sesi
        $exists = Material::whereKey($referenceId)
            ->whereIn('curriculum_id', Curriculum::where('subject_id', $session->subject_id)->select('id'))
            ->exists();

        if (!$exists) {
            throw ValidationException::withMessages(['activityable_id' => ['Materi tidak ditemukan pada kurikulum mata pelajaran sesi ini.']]);
        }

        return ['type' => 'material', 'id' => $referenceId];
    }
}
