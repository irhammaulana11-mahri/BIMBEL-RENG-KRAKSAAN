<?php

namespace App\Http\Controllers\Api\Common;

use App\Http\Controllers\Controller;
use App\Models\Academic\Material;
use App\Services\Academic\MaterialFileService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

/**
 * Unggah (Admin) & buka (ber-otorisasi) berkas materi di disk privat.
 */
class MaterialFileController extends Controller {

    public function __construct(protected MaterialFileService $files) {}

    public function upload(Request $request) {
        $request->validate([
            'file' => ['required', 'file', 'mimes:pdf,doc,docx,ppt,pptx,png,jpg,jpeg,webp,mp4', 'max:20480'],
        ], [
            'file.mimes' => 'Format berkas harus PDF, Word, PowerPoint, gambar, atau MP4.',
            'file.max'   => 'Ukuran berkas maksimal 20 MB.',
        ]);

        $file = $request->file('file');
        $path = $this->files->store($file);

        return response()->json([
            'success' => true,
            'data'    => [
                // Path disimpan apa adanya di materials.file_path (bukan URL publik)
                'url'           => $path,
                'path'          => $path,
                'original_name' => $file->getClientOriginalName(),
                'size'          => $file->getSize(),
                'extension'     => $file->getClientOriginalExtension(),
            ],
        ]);
    }

    public function show(Material $material) {
        abort_unless($this->files->canAccess(Auth::user(), $material), 403, 'Anda tidak memiliki akses ke materi ini.');

        return $this->files->stream($material);
    }
}
