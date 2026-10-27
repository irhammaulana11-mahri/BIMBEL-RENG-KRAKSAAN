<?php
namespace App\Support;

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Hapus data master dalam transaksi. Bila data masih dipakai tabel lain (FK RESTRICT),
 * seluruh penghapusan dibatalkan dan dikembalikan sebagai pesan 422, bukan error 500.
 */
class SafeDelete {

    public static function run(callable $delete, string $inUseMessage): void {
        try {
            DB::transaction($delete);
        } catch (QueryException $e) {
            // 23503 = foreign_key_violation
            if (($e->errorInfo[0] ?? null) === '23503') {
                throw ValidationException::withMessages(['delete' => $inUseMessage]);
            }
            throw $e;
        }
    }
}
