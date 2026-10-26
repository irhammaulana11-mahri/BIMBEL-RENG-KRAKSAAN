<?php
namespace App\Support;

use Carbon\Carbon;
use Carbon\CarbonInterface;

/**
 * Konversi waktu lokal bimbel (WIB) <-> timezone aplikasi (UTC).
 * Input/tampilan memakai WIB, database menyimpan waktu aplikasi.
 */
class LocalTime {

    public const TIMEZONE = 'Asia/Jakarta';

    // "2026-10-27 08:00" / "2026-10-27T08:00" (WIB) -> Carbon timezone aplikasi
    public static function parse(?string $value): ?Carbon {
        if ($value === null || $value === '') return null;
        return Carbon::parse($value, self::TIMEZONE)->setTimezone(config('app.timezone'));
    }

    // Tanggal hari ini menurut WIB (Y-m-d), bukan tanggal UTC server
    public static function today(): string {
        return Carbon::now(self::TIMEZONE)->toDateString();
    }

    // Carbon -> string WIB (default untuk input datetime-local)
    public static function format(?CarbonInterface $value, string $format = 'Y-m-d\TH:i'): ?string {
        return $value ? $value->copy()->setTimezone(self::TIMEZONE)->format($format) : null;
    }
}
