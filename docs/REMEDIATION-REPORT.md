# Laporan Akhir Remediasi Keamanan & Database — Bimbel Reng Kraksaan

Tanggal: 29 Oktober 2026 · Basis awal: commit `965cd9d` · Hasil akhir: commit `6f582ba` (`main`)
Dokumen terkait: [REMEDIATION-SPEC.md](REMEDIATION-SPEC.md) (keputusan bisnis & rancangan), [DEPLOY.md](../DEPLOY.md) (konfigurasi), [SERVER-SETUP.md](SERVER-SETUP.md) (langkah penyiapan server & Cloudflare).

## 1. Ringkasan

Audit keamanan & database sebelumnya berstatus **NOT READY** dengan 3 temuan HIGH, beberapa MEDIUM, dan sejumlah
LOW/INFO. Remediasi dikerjakan bertahap (T0–T12) dengan aturan: setiap tahap punya test, migration diuji di
database terisolasi (`bimbel_test`) naik/turun/naik sebelum dijalankan di database pengembangan, dan setiap
migration didahului backup terverifikasi.

- **Status akhir: CONDITIONALLY READY** (syarat di bagian 7).
- **Semua temuan HIGH dan MEDIUM ditutup.** Yang tersisa hanya DB-01 (akun database tunggal), diterima sementara karena fitur restore membutuhkannya.
- **Test otomatis:** dari 2 test contoh (SQLite, tidak relevan) menjadi **134 test feature di PostgreSQL**, semuanya lulus.
- **6 migration baru**, semuanya diuji naik/turun/naik dan sudah berjalan di database pengembangan.
- Laporan ini tidak menyatakan aplikasi sepenuhnya aman; berlaku untuk cakupan dan bukti di bawah.

## 2. Status temuan audit

| ID | Risiko | Temuan | Penyelesaian | Tahap |
|---|---|---|---|---|
| SEC-01 | HIGH | Login tanpa batas percobaan | 5 gagal/menit per email + IP → HTTP 429 + `Retry-After` | T2 |
| SEC-02 | HIGH | Akun/profil nonaktif tetap bisa memakai token & login | Dicek setiap permintaan (Sanctum), token dicabut saat dinonaktifkan | T2 |
| SEC-03 | HIGH | Dependensi rentan (Laravel, guzzle, symfony, dompdf, commonmark, npm) | Diperbarui; `composer audit` & `npm audit` bersih; 3 paket tak terpakai dihapus | T3 |
| SEC-04 | MEDIUM | Token tidak pernah kedaluwarsa | Berlaku 12 jam; token kedaluwarsa dibersihkan harian | T2 |
| SEC-05 | MEDIUM | Stored XSS di halaman artikel publik | Isi artikel ditampilkan sebagai teks, bukan HTML | T12 |
| SEC-06 | MEDIUM | Restore menjalankan `psql` tanpa cek versi | Restore ditolak bila client < 17.6/16.10/15.14/14.19/13.22 | T12 |
| MOB-01 | MEDIUM | Android mengizinkan HTTP biasa | Rilis wajib HTTPS (dicek saat build & saat dibuka); HTTP hanya debug | T11 |
| MOB-02 | MEDIUM | APK rilis ditandatangani kunci debug | Signing dari `key.properties`; tanpa itu build rilis dihentikan | T11 |
| FIN-01 | MEDIUM | Approve/reject bersamaan merusak status tagihan | Kunci baris pembayaran + cek ulang status | T5 |
| FIN-02 | MEDIUM | Absensi siswa bisa diubah setelah tagihan/payroll terbit | Absensi terkunci; perubahan lewat koreksi dengan persetujuan & dampak keuangan | T9 |
| FIN-03 | MEDIUM | Tidak ada jejak audit keuangan | Tabel jejak audit append-only di transaksi yang sama | T6 |
| FIN-04 | LOW | Dua bukti bayar bersamaan → 2 PENDING | Maksimal 1 PENDING per tagihan; **terbukti** dengan dua proses serentak | T5 |
| FIN-05 | LOW | Race yang tertahan constraint → error 500 | Pelanggaran unique → 422 berpesan | T5 |
| LOW-01 | LOW | Pesan exception/SQL dikirim ke klien | Detail hanya di log | T12 |
| LOW-02 | LOW | `$request->all()` | Validasi eksplisit (kodenya ternyata tidak punya route) | T12 |
| LOW-03 | LOW | CORS default | `config/cors.php` eksplisit lewat `CORS_ALLOWED_ORIGINS` | T12 |
| LOW-04 | LOW | 403 memaksa logout di web | Hanya 401/419 yang mengeluarkan pengguna | T12 |
| LOW-05 | LOW | Admin tidak bisa ganti password sendiri | `PUT /api/admin/password` + menu | T12 |
| DB-02 | LOW | `fee_rule_id` tanpa FK; nominal tanpa CHECK > 0 | FK RESTRICT + CHECK; hapus aturan terpakai → 422 | T10 |
| DB-03 | INFO | FK ganda di `academic.schedules` | 8 FK → 4 FK RESTRICT (perilaku efektif terbukti tidak berubah) | T10 |
| **DB-01** | LOW | Akun DB aplikasi pemilik semua schema | **Diterima sementara:** restore backup butuh akun pemilik schema; pemisahan perlu perubahan kode (lihat SERVER-SETUP.md C1) | — |

**Temuan baru selama remediasi (ditutup):**

| Temuan | Penyelesaian |
|---|---|
| Satu absensi tentor secara teknis bisa dibayar di dua payroll | Unique index global (T8) |
| Sesi payroll bulan lalu otomatis ikut payroll berikutnya | Daftar pengecualian dengan pemeriksaan & persetujuan (T8) |
| Hapus jadwal meng-CASCADE sesi & absensi yang sudah ditagih (endpoint sebelumnya error 500) | Jadwal yang sudah berjalan tidak bisa dihapus (T10) |
| Peran admin bisa melihat ada/tidaknya ID backup (404 vs 403) | Peran dicek sebelum data dicari, semua route (T4) |
| `search_path` salah tulis (DB-08) | Ditulis ulang tanpa perubahan perilaku (T12) |
| Peran `super_admin` salah eja → super admin ke landing page | Diperbaiki (perbaikan UI) |
| Nama berkas unduhan tidak terbaca lintas domain | Header `Content-Disposition` diekspos lewat CORS (T12) |

## 3. Keputusan bisnis yang diterapkan

Rincian lengkap di [REMEDIATION-SPEC.md](REMEDIATION-SPEC.md). Ringkasnya:

- **Operator tunggal (D-11):** admin & super admin dipegang satu orang. Persetujuan atas pekerjaan sendiri
  diizinkan dengan password ulang dan alasan tertulis, ditandai `self_approved`, dan masuk laporan bulanan.
  Mode `separated` (penyetuju harus akun lain) sudah dibuat dan diuji, diaktifkan lewat `FINANCE_APPROVAL_MODE`.
- **Pembayaran salah:** dibatalkan dengan reversal, pembayaran asli tidak dihapus/diubah.
- **Payroll:** bukti transfer (nomor referensi + berkas) wajib; tentor mengonfirmasi penerimaan.
- **Absensi setelah tagihan:** terkunci; koreksi menghasilkan tagihan penyesuaian (kurang tagih), refund atau
  kredit (lebih tagih), dan potongan/penambah honor atau permintaan pengembalian dana ke tentor.
- **Backup:** hanya super admin. Jejak audit ikut backup & restore.
- **Token:** 12 jam. **Login:** 5 gagal/menit per email + IP.

**Risiko residual yang diterima pemilik:** satu pengelola dapat melakukan tindakan tidak sah yang hanya
terdeteksi (jejak audit, laporan bulanan, konfirmasi tentor, notifikasi orang tua), tidak dicegah. Tidak ada
peninjau di luar sistem, sehingga laporan bulanan berfungsi sebagai arsip.

## 4. Riwayat perubahan

| Commit | Tahap | Isi |
|---|---|---|
| `5175d1a` | T1 | Test PostgreSQL terisolasi + reproduksi temuan |
| `ef293dd` | T2 | Batas login, token 12 jam, akun nonaktif |
| `4b7418d` | T3 | Upgrade dependensi |
| `e4fbecd` | T4 | Backup khusus super admin |
| `c2a7397` | T5 | Integritas pembayaran |
| `75a8d31` | T6 | Jejak audit keuangan |
| `0d622bf` | T7 | Reversal pembayaran |
| `ea9f83b` | T8 | Payroll: operator tunggal, bukti transfer, pengecualian |
| `63c2de6` | T9 | Kunci & koreksi absensi |
| `f0c9b08`, `1347825` | T10 | Constraint keuangan; FK jadwal; hapus jadwal |
| `8660f47` | — | Perbaikan UI (penilaian, kartu, redirect super admin, dashboard) |
| `40f3138` | T12 | Pengerasan keamanan |
| `562c594` | — | Branding ikon & layar pembuka |
| `6f582ba` | T11 | Rilis Android |

## 5. Migration database

Semua diuji naik → turun → naik di `bimbel_test` (skema identik), lalu dijalankan di database pengembangan.

| Migration | Isi |
|---|---|
| `2026_10_29_130000_create_finance_audit_logs_table` | Jejak audit keuangan |
| `2026_10_29_140000_create_payment_reversals_table` | Reversal pembayaran |
| `2026_10_29_150000_add_payroll_separation_and_exceptions` | Kolom penyusun/bukti/konfirmasi, pengecualian payroll, unique absensi dibayar sekali |
| `2026_10_29_160000_create_attendance_corrections_and_adjustments` | Koreksi absensi, tagihan penyesuaian, kredit, refund, penyesuaian honor |
| `2026_10_29_170000_add_finance_integrity_constraints` | CHECK nominal > 0, FK `fee_rule_id` (menolak berjalan bila ada data pelanggar) |
| `2026_10_29_180000_dedupe_schedule_foreign_keys` | 4 FK RESTRICT pengganti 8 FK ganda |

Saat server baru dipasang, `php artisan migrate --force` menjalankan semuanya dari nol (diuji sejak T1 setiap
kali suite test berjalan).

## 6. Pengujian

- `php artisan test` hanya berjalan pada database `bimbel_test` dan menolak berjalan bila config ter-cache
  atau koneksi menunjuk database lain.
- **134 test lulus**: kontrol akses & IDOR, siklus akun, akses backup, integritas & konkurensi pembayaran
  (dua proses PHP serentak), reversal, payroll, koreksi absensi, constraint database, jejak audit, PDF, dan
  pengerasan (versi client PostgreSQL, CORS, ganti password).
- Restore backup sungguhan diuji ulang di `bimbel_test` setelah upgrade framework (T3).
- Build: web (`npm run build`), Android debug & rilis (dengan keystore uji yang kemudian dihapus).

**Belum diuji:** tampilan web & Android secara manual (klik-uji), aplikasi di HP sungguhan, server produksi,
fitur rekomendasi AI (test sengaja tidak memanggil layanan luar).

## 7. Syarat sebelum rilis

1. Klik-uji manual fitur baru di browser & HP: reversal, payroll (persetujuan, transfer, pengecualian,
   konfirmasi tentor), koreksi absensi, ganti password admin, dashboard, branding.
2. Pasang server lokal + Cloudflare Tunnel sesuai [SERVER-SETUP.md](SERVER-SETUP.md): pemulihan IP asli di
   Nginx (agar batas login tetap per pengguna), `APP_URL` https, `CORS_ALLOWED_ORIGINS`, `APP_DEBUG=false`,
   cron penjadwal, PostgreSQL client ≥ 16.10, UPS & cadangan di luar server.
3. Buat keystore rilis Android dan simpan cadangannya; build APK dengan `API_URL` HTTPS. Pengguna APK lama perlu
   uninstall sekali.
4. DB-01: akun database tetap tunggal (pemilik schema) karena restore backup membutuhkannya; pemisahan akun = rencana perubahan kode tersendiri.
5. Salin backup ke penyimpanan di luar laptop pengembangan (satu-satunya disk saat ini).

## 8. Catatan operasional

- **Retensi backup saat ini 1** (bawaan 14): setiap backup baru menghapus yang sebelumnya. Disarankan
  dinaikkan minimal 7 di menu Backup & Pemulihan.
- **Titik kembali ke kondisi sebelum remediasi:** dump independen `~/bimbel-backup-T0/bimbel_kraksaan_db-20261029-T0.dump`
  (database saja, tanpa berkas upload). Backup aplikasi tertua yang tersisa dibuat setelah migration T10.
- **Rollback kode:** setiap tahap satu/dua commit di `main`; migration punya `down()` yang sudah diuji.
- Ikon aplikasi Android tertanam di APK; bila logo lembaga diganti, aset perlu dibuat ulang.
- Independensi: sebagian besar kode yang diaudit dan diperbaiki ditulis oleh asisten AI yang sama; audit ulang
  oleh pihak independen disarankan sebelum data produksi yang sensitif digunakan.
