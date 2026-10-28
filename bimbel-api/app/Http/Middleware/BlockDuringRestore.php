<?php

namespace App\Http\Middleware;

use App\Services\System\BackupService;
use Closure;
use Illuminate\Http\Request;

/**
 * Selama pemulihan data berjalan, semua permintaan API ditolak (503) agar tidak ada data
 * baru yang tertulis lalu hilang tertimpa. Hanya status pemulihan yang tetap bisa dibaca.
 */
class BlockDuringRestore {
    public function handle(Request $request, Closure $next) {
        if ($request->is('api/admin/backups/status')) return $next($request);

        if (app(BackupService::class)->restoreInProgress() !== null) {
            return response()->json([
                'success'     => false,
                'maintenance' => true,
                'message'     => 'Sistem sedang memulihkan data dari backup. Silakan coba lagi beberapa menit lagi.',
            ], 503);
        }

        return $next($request);
    }
}
