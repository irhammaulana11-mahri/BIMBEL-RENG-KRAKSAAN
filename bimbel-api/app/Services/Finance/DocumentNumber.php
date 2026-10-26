<?php
namespace App\Services\Finance;

use Illuminate\Support\Facades\DB;

/**
 * Penomoran dokumen keuangan berurutan per prefix, contoh INV-202610-0001.
 * Harus dipanggil di dalam transaksi: advisory lock mencegah nomor ganda saat bersamaan.
 */
class DocumentNumber {

    public static function next(string $table, string $column, string $prefix, int $padding = 4): string {
        DB::select('SELECT pg_advisory_xact_lock(?)', [crc32($table . ':' . $prefix)]);

        $last = DB::table($table)
            ->where($column, 'like', $prefix . '%')
            ->orderByDesc($column)
            ->value($column);

        $sequence = $last ? ((int) substr($last, strlen($prefix))) + 1 : 1;

        return $prefix . str_pad((string) $sequence, $padding, '0', STR_PAD_LEFT);
    }
}
