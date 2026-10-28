<?php
namespace App\Support;

use App\Models\Website\CompanyProfile;
use Barryvdh\DomPDF\Facade\Pdf as DomPdf;

/**
 * Dokumen PDF (slip honor, rekap evaluasi, invoice) dengan kop lembaga yang sama.
 * Dibuat di server agar web & Android mengunduh berkas yang identik.
 */
class Pdf {

    public static function download(string $view, array $data, string $filename, string $orientation = 'portrait') {
        return DomPdf::loadView($view, $data + ['company' => self::company()])
            // Hanya karakter yang dipakai yang ditanam, agar ukuran berkas kecil
            ->setOption('isFontSubsettingEnabled', true)
            ->setPaper('a4', $orientation)
            ->download($filename);
    }

    // Data kop: nama, alamat, kontak & logo (disematkan base64 agar tidak perlu akses jaringan)
    private static function company(): array {
        $profile = CompanyProfile::first();
        $logo = null;
        if ($profile?->logo_url) {
            $path = storage_path('app/public/' . ltrim(str_replace('/storage/', '', parse_url($profile->logo_url, PHP_URL_PATH) ?? ''), '/'));
            if (is_file($path)) {
                $logo = 'data:' . mime_content_type($path) . ';base64,' . base64_encode(file_get_contents($path));
            }
        }

        return [
            'name'    => $profile?->company_name ?? config('app.name'),
            'address' => $profile?->address,
            'contact' => collect([$profile?->phone ? "Telp {$profile->phone}" : null, $profile?->whatsapp ? "WA {$profile->whatsapp}" : null, $profile?->email])->filter()->join(' • '),
            'logo'    => $logo,
        ];
    }

    public static function rupiah($value): string {
        return 'Rp ' . number_format((float) $value, 0, ',', '.');
    }
}
