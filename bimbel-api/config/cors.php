<?php

/*
|--------------------------------------------------------------------------
| CORS (LOW-03)
|--------------------------------------------------------------------------
|
| API memakai token Bearer (bukan cookie), jadi supports_credentials tetap false.
| Di produksi, isi CORS_ALLOWED_ORIGINS dengan alamat web (pisahkan koma), mis.
| https://bimbelreng.id,https://www.bimbelreng.id. Kosong = semua origin (pengembangan).
| Aplikasi Android tidak terpengaruh CORS.
|
*/

$origins = array_values(array_filter(array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS', '')))));

return [

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => $origins ?: ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    // Nama berkas unduhan (PDF slip/invoice/laporan) dibaca web dari header ini
    'exposed_headers' => ['Content-Disposition'],

    'max_age' => 0,

    'supports_credentials' => false,

];
