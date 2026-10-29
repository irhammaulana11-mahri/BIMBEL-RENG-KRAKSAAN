<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Mode persetujuan keuangan (D-11)
    |--------------------------------------------------------------------------
    |
    | single_operator : satu orang mengelola keuangan. Persetujuan atas pengajuan sendiri diizinkan,
    |                   tetapi wajib konfirmasi ulang password dan alasan tertulis, lalu ditandai
    |                   self_approved di catatan & jejak audit.
    | separated       : penyetuju harus akun yang berbeda dari pengaju.
    |
    */

    'approval_mode' => env('FINANCE_APPROVAL_MODE', 'single_operator'),

];
