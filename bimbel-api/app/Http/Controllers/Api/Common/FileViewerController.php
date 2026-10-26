<?php

namespace App\Http\Controllers\Api\Common;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use URL;

class FileViewerController extends Controller
{
    /**
     * 🟢 Generate Temporary Signed Stream URL (Expired dalam 5 menit)
     */
    public static function generateSignedUrl($folder, $filename)
    {
        return URL::temporarySignedRoute(
            'api.files.view',
            now()->addMinutes(5),
            [
                'folder' => $folder,
                'filename' => $filename
            ]
        );
    }

    /**
     * 🟢 Stream PDF secara aman (No-Store & Inline Content-Disposition)
     */
    public function streamFile(Request $request, $folder, $filename)
    {
        // Path fisik di disk public / local
        $path = "{$folder}/{$filename}";

        if (!Storage::disk('public')->exists($path)) {
            abort(404, 'Berkas materi tidak ditemukan.');
        }

        $fullPath = Storage::disk('public')->path($path);
        $mimeType = Storage::disk('public')->mimeType($path) ?? 'application/pdf';

        // Headers ketat untuk mencegah caching & penjelajahan eksternal
        $headers = [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="' . basename($filename) . '"',
            'Cache-Control' => 'no-store, no-cache, must-revalidate, max-age=0',
            'Pragma' => 'no-cache',
            'Expires' => '0',
            'X-Content-Type-Options' => 'nosniff',
        ];

        return response()->stream(function () use ($fullPath) {
            $stream = fopen($fullPath, 'rb');
            fpassthru($stream);
            if (is_resource($stream)) {
                fclose($stream);
            }
        }, 200, $headers);
  }
}