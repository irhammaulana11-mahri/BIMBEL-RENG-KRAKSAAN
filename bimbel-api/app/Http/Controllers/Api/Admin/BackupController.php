<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\System\Backup;
use App\Models\System\BackupSetting;
use App\Services\System\BackupService;
use App\Support\LocalTime;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;
use RuntimeException;

use function Illuminate\Support\defer;

/**
 * Menu Backup & Pemulihan (Admin).
 * Backup dan pemulihan berjalan setelah respons dikirim; halaman memantau lewat /status.
 */
class BackupController extends Controller
{
    public function __construct(private BackupService $service) {}

    /** GET /admin/backups */
    public function index() {
        $overview = $this->service->overview();
        $backups = Backup::with(['creator:id,name', 'restorer:id,name'])->latest()->get();

        return response()->json([
            'success'  => true,
            'data'     => $backups->map(fn(Backup $b) => $this->present($b))->values(),
            'settings' => $overview['settings'],
            'summary'  => $overview['summary'],
        ]);
    }

    /** GET /admin/backups/status — tetap bisa dibaca saat pemulihan berjalan */
    public function status() {
        $running = Backup::where('status', 'RUNNING')->latest()->first();
        $restore = $this->service->restoreInProgress();
        $lastRestore = Backup::whereNotNull('restore_status')->latest('updated_at')->first();

        return response()->json([
            'success' => true,
            'data'    => [
                'running'      => $running ? $this->present($running) : null,
                'restore'      => $restore,
                'last_restore' => $lastRestore ? $this->present($lastRestore) : null,
            ],
        ]);
    }

    /** POST /admin/backups — backup manual */
    public function store(Request $request) {
        $data = $request->validate([
            'include_files' => ['boolean'],
            'note'          => ['nullable', 'string', 'max:255'],
        ]);

        $backup = $this->attempt(fn() => $this->service->start('MANUAL', $data['include_files'] ?? true, Auth::id(), $data['note'] ?? null));
        defer(fn() => $this->service->run($backup));

        return response()->json(['success' => true, 'message' => 'Backup sedang dibuat.', 'data' => $this->present($backup)], 202);
    }

    /** PUT /admin/backups/settings */
    public function updateSettings(Request $request) {
        $data = $request->validate([
            'enabled'         => ['required', 'boolean'],
            'frequency'       => ['required', Rule::in(BackupSetting::FREQUENCIES)],
            'run_time'        => ['required', 'date_format:H:i'],
            'day_of_week'     => ['required_if:frequency,WEEKLY', 'nullable', 'integer', 'between:1,7'],
            'day_of_month'    => ['required_if:frequency,MONTHLY', 'nullable', 'integer', 'between:1,28'],
            'include_files'   => ['required', 'boolean'],
            'retention_count' => ['required', 'integer', 'between:1,90'],
        ], [
            'day_of_month.between' => 'Tanggal backup bulanan 1-28 agar ada di setiap bulan.',
        ]);

        $settings = BackupSetting::current();
        $settings->update(array_filter($data, fn($v) => $v !== null) + ['updated_by' => Auth::id()]);
        $this->service->prune();

        return response()->json([
            'success' => true,
            'message' => 'Jadwal backup disimpan.',
            'data'    => $settings->refresh(),
            'next_run_at' => LocalTime::format($this->service->nextSlot($settings), 'Y-m-d H:i'),
        ]);
    }

    /** POST /admin/backups/upload — arsip dari server lain / salinan luar */
    public function upload(Request $request) {
        $request->validate([
            'file' => ['required', 'file', 'mimes:zip', 'max:1048576'],
            'note' => ['nullable', 'string', 'max:255'],
        ], [
            'file.uploaded' => 'Berkas gagal diunggah. Ukurannya mungkin melebihi batas upload server (upload_max_filesize).',
        ]);

        $backup = $this->attempt(fn() => $this->service->importUpload($request->file('file')->getRealPath(), Auth::id(), $request->input('note')));
        return response()->json(['success' => true, 'message' => 'Backup diunggah dan lolos verifikasi.', 'data' => $this->present($backup)], 201);
    }

    /** GET /admin/backups/{backup}/verify */
    public function verify(Backup $backup) {
        $result = $this->attempt(fn() => $this->service->verify($backup));
        return response()->json(['success' => true, 'data' => [
            'checks'             => $result['checks'],
            'pending_migrations' => $result['pending_migrations'],
            'created_at'         => $result['manifest']['created_at'] ?? null,
            'files'              => $result['manifest']['files'] ?? null,
        ]]);
    }

    /** POST /admin/backups/{backup}/restore — wajib password akun & ketik PULIHKAN */
    public function restore(Request $request, Backup $backup) {
        $data = $request->validate([
            'password'      => ['required', 'string'],
            'confirmation'  => ['required', 'string'],
            'restore_files' => ['boolean'],
        ]);

        if (!Hash::check($data['password'], Auth::user()->password)) {
            throw ValidationException::withMessages(['password' => 'Password salah.']);
        }
        if ($data['confirmation'] !== 'PULIHKAN') {
            throw ValidationException::withMessages(['confirmation' => 'Ketik PULIHKAN (huruf kapital) untuk konfirmasi.']);
        }

        $restoreFiles = $data['restore_files'] ?? true;
        $userId = Auth::id();
        $this->attempt(fn() => $this->service->beginRestore($backup, $userId, $restoreFiles));
        defer(fn() => $this->service->performRestore($backup, $userId, $restoreFiles));

        return response()->json(['success' => true, 'message' => 'Pemulihan dimulai. Sistem dikunci sampai selesai.'], 202);
    }

    /** GET /admin/backups/{backup}/download */
    public function download(Backup $backup) {
        abort_unless($backup->status === 'SUCCESS' && $backup->fileExists(), 404, 'Berkas backup tidak ditemukan.');
        return response()->download($backup->path(), $backup->filename, ['Content-Type' => 'application/zip']);
    }

    /** DELETE /admin/backups/{backup} */
    public function destroy(Backup $backup) {
        $this->attempt(fn() => $this->service->delete($backup));
        return response()->json(['success' => true, 'message' => 'Backup dihapus.']);
    }

    // Pesan RuntimeException dari service ditampilkan sebagai 422
    private function attempt(callable $fn) {
        try {
            return $fn();
        } catch (RuntimeException $e) {
            throw ValidationException::withMessages(['backup' => $e->getMessage()]);
        }
    }

    private function present(Backup $b): array {
        return [
            'id'             => $b->id,
            'filename'       => $b->filename,
            'type'           => $b->type,
            'type_label'     => Backup::TYPE_LABELS[$b->type] ?? $b->type,
            'status'         => $b->status,
            'include_files'  => $b->include_files,
            'size_bytes'     => $b->size_bytes,
            'size_label'     => $b->size_bytes ? $this->service->humanSize($b->size_bytes) : null,
            'file_exists'    => $b->fileExists(),
            'files'          => $b->manifest['files'] ?? null,
            'migration_latest' => $b->manifest['migration_latest'] ?? null,
            'note'           => $b->note,
            'error_message'  => $b->error_message,
            'created_by'     => $b->creator?->name ?? ($b->type === 'SCHEDULED' ? 'Sistem (terjadwal)' : null),
            'started_at'     => LocalTime::format($b->started_at, 'Y-m-d H:i'),
            'finished_at'    => LocalTime::format($b->finished_at, 'Y-m-d H:i'),
            'duration_sec'   => $b->started_at && $b->finished_at ? (int) $b->started_at->diffInSeconds($b->finished_at) : null,
            'restore_status' => $b->restore_status,
            'restore_error'  => $b->restore_error,
            'restored_by'    => $b->restorer?->name,
            'restored_at'    => LocalTime::format($b->restored_at, 'Y-m-d H:i'),
        ];
    }
}
