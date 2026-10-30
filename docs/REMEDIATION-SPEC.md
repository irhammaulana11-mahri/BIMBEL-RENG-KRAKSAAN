# Spesifikasi Keputusan Remediasi — Bimbel Reng Kraksaan

Versi: 1.0 (draf untuk ditinjau) · Tanggal: 2026-10-29 · Basis kode: commit `965cd9d` (`main`)
Sumber: Laporan Audit Keamanan & Database (status NOT READY), Baseline Pra-Perbaikan, keputusan pemilik produk 2026-10-29.

Dokumen ini adalah kontrak kerja untuk AI coding agent. Bagian 1 berisi aturan kerja, bagian 2 keputusan
yang mengikat, bagian 3–6 turunan teknisnya, bagian 7 pertanyaan yang masih terbuka beserta nilai bawaan
sementara. Agent **tidak boleh** menyimpang dari keputusan di bagian 2; bila kode nyata bertentangan dengan
dokumen ini, berhenti dan laporkan, jangan menebak.

---

## 1. Aturan kerja agent

1. **Belum ada izin implementasi.** Dokumen ini harus disetujui pemilik produk lebih dulu. Setelah disetujui,
   kerjakan **satu tahap per giliran** (bagian 6), lalu berhenti untuk ditinjau.
2. Setiap tahap: satu branch `remediation/T<n>-<slug>`, satu atau beberapa commit, diff ditunjukkan,
   suite test lengkap dijalankan dan hasilnya dilaporkan apa adanya (termasuk yang gagal).
3. **Database:** migration hanya dijalankan di DB uji terisolasi (`bimbel_test`) sampai pemilik produk
   menyetujui penerapan ke DB pengembangan. Dilarang `migrate:fresh`, `migrate:refresh`, `db:wipe`,
   `TRUNCATE`, `DROP` di DB pengembangan/produksi. Setiap migration wajib punya `down()` yang diuji.
4. **Sebelum tahap yang menyentuh skema atau data keuangan:** `php artisan backup:run`, verifikasi arsip,
   catat nama berkas di laporan tahap.
5. **Rahasia:** jangan menampilkan isi `.env`, token, password, atau data pribadi. Redaksi di log dan laporan.
5a. **Test:** `php artisan test` hanya memakai DB `bimbel_test` dan menolak berjalan bila config ter-cache atau
   koneksi menunjuk DB lain (`tests/TestCase.php`). Test bergrup `temuan-terbuka` sengaja gagal sampai
   tahap perbaikannya selesai; suite tanpa grup itu (`--exclude-group=temuan-terbuka`) wajib selalu hijau.
   Saat sebuah temuan diperbaiki, hapus atribut grup `temuan-terbuka` dari test-nya.
6. **Dependensi:** hanya diubah di tahap yang ditentukan (T3, serta sanitizer di T12). Jangan menambah
   paket lain tanpa persetujuan.
7. **Ikuti gaya kode yang ada:** logika di `app/Services/...`, validasi di Form Request, pesan error
   berbahasa Indonesia, `ValidationException::withMessages` untuk 422, `DB::transaction` + `lockForUpdate`
   untuk mutasi keuangan, UUID (`HasUuids`) untuk tabel baru, schema PostgreSQL sesuai domain
   (`finance`, `academic`, `logs`). Timestamp disimpan UTC (zona aplikasi), ditampilkan WIB.
8. Penegakan aturan **selalu di server**. Menyembunyikan tombol di web/Android hanya pelengkap.
9. Jangan mengubah histori: baris tagihan, item tagihan, pembayaran, dan payroll yang sudah final tidak
   boleh di-`UPDATE` nilainya atau di-`DELETE`. Koreksi selalu berupa catatan baru yang mereferensikan
   catatan asli.

---

## 2. Keputusan yang mengikat

### D-01 · Absensi siswa dikunci setelah tagihan terbit

**Aturan.** Satu baris `academic.student_attendances` (sesi S, siswa X) **terkunci** bila salah satu benar:
- (a) ada `finance.invoices` berstatus ≠ `CANCELLED` untuk siswa X, kelas dari jadwal sesi S
  (`schedule_sessions.schedule_id → schedules.class_id`), dengan `period_year/period_month` = bulan
  `session_date` S; atau
- (b) `academic.tentor_attendances` sesi S sudah `is_payroll_processed = true` (honor PER_STUDENT
  menghitung siswa hadir, lihat `FeeRuleEngine.php:182-189`).

**Perilaku.**
- Semua jalur ubah absensi biasa (Admin `POST admin/attendances/sessions/{session}/students`,
  portal tentor, jalur lain yang ditemukan agent) menolak baris terkunci dengan **422** dan pesan yang
  menyebut alasan kunci (tagihan atau payroll) serta arahan "ajukan koreksi".
- Pengecekan dilakukan di service (`AttendanceService`), satu fungsi bersama `lockReason($session, $studentId)`,
  dipanggil di dalam transaksi.
- Agent wajib menginventaris **semua** titik tulis ke `student_attendances` (grep model + query builder)
  dan mencantumkannya di laporan tahap.

**Koreksi absensi terkunci** (tabel baru `academic.attendance_corrections`):
- Diajukan dengan: baris absensi, status lama (snapshot), status baru, **alasan wajib** (min. 10 karakter),
  `requested_by`, `requested_at`.
- Disetujui/ditolak oleh akun **berbeda** dari pengaju: `approved_by`/`rejected_by`, waktu, catatan.
  Status: `PENDING | APPROVED | REJECTED`. Satu baris absensi maksimal satu koreksi `PENDING`.
- Saat pengajuan, sistem **menghitung dan menyimpan dampak keuangan** (`financial_effect` JSON):
  selisih tagihan per tagihan terdampak (dihitung ulang dengan `FeeRuleEngine` memakai **tarif snapshot**
  dari `invoice_items`, bukan tarif aktif) dan selisih honor per payroll terdampak. Penyetuju melihat
  dampak ini sebelum menyetujui.
- Saat disetujui (satu transaksi): baris absensi diperbarui ke status baru; koreksi menyimpan snapshot
  sebelum/sesudah; dampak keuangan dibuat sebagai **catatan penyesuaian baru** (aturan di bawah).
  **Tagihan, item tagihan, dan payroll yang sudah terbit tidak diubah.**

**Dampak ke tagihan siswa** (Q-01, Q-02 terjawab):
- **Kurang tagih** (selisih +): dibuat **tagihan penyesuaian terpisah**. Kolom baru
  `invoices.invoice_type` (`REGULAR` | `ADJUSTMENT`, bawaan `REGULAR`) dan `invoices.adjusts_invoice_id`
  (FK RESTRICT ke tagihan asli). Item tagihan penyesuaian menyebut sesi, status lama → baru, dan tarif
  snapshot. Partial unique index tagihan per periode diubah agar hanya berlaku untuk `REGULAR`
  (perubahan index eksisting, uji ketat di `bimbel_test`).
- **Lebih tagih** (selisih −, nilai E): operator **memilih per koreksi** salah satu:
  - `REFUND`: catat pengembalian dana di tabel baru `finance.refunds` (nominal, metode CASH/TRANSFER,
    `reference_no`, berkas bukti wajib, pelaksana, waktu, referensi tagihan + koreksi). Hanya bisa sebesar
    bagian E yang **sudah dibayar**.
  - `CREDIT`: catat saldo kredit di tabel baru `finance.credit_notes` (siswa, nominal, sisa, sumber
    koreksi + tagihan). Kredit dipakai otomatis saat tagihan `REGULAR` berikutnya untuk siswa yang sama
    terbit, melalui tabel `finance.credit_applications` (kredit → tagihan, nominal). Kredit tertua dulu;
    sisa kredit dibawa ke tagihan berikutnya lagi.
  - Bagian E yang **belum dibayar** pada tagihan asli tidak bisa dikembalikan; bagian itu otomatis
    menjadi kredit yang langsung diterapkan ke tagihan asli itu sendiri (via `credit_applications`,
    tanpa mengubah item tagihan).
- `InvoiceService::recalculate`: `paid_amount` = pembayaran valid (CONFIRMED tanpa reversal APPROVED, D-02)
  **+** `credit_applications` ke tagihan itu. Refund **tidak** mengurangi `paid_amount` tagihan yang
  dikoreksi, karena yang berubah adalah kewajibannya (dicatat lewat refund), bukan pembayarannya. Tampilan
  orang tua menunjukkan: tagihan asli, koreksi, refund/kredit, dan saldo kredit tersisa.
- Orang tua menerima notifikasi untuk setiap tagihan penyesuaian, refund, dan kredit.

**Dampak ke honor tentor** (Q-03 terjawab):
- **Honor kelebihan bayar** (payroll yang terdampak sudah `APPROVED`/`PAID`): operator **memilih per koreksi**:
  - `DEDUCT`: baris pengurang (negatif) di payroll bulan berikutnya untuk tentor itu, berlabel sumber
    koreksi dan periode asli. Bila honor bulan berikutnya lebih kecil dari pengurang, sisanya dibawa ke
    bulan selanjutnya; total transfer per tentor tidak pernah negatif.
  - `REFUND_REQUEST`: tawarkan pengembalian dana ke tentor; tercatat sebagai tagihan ke tentor
    (`finance.payroll_recoveries`: nominal, status `OPEN | SETTLED | CONVERTED_TO_DEDUCT`, bukti terima).
    Bila tidak diselesaikan, operator bisa mengubahnya ke `DEDUCT`.
- **Honor kurang bayar**: baris penambah di payroll bulan berikutnya, melalui daftar pengecualian D-05.
- Payroll yang masih `DRAFT` cukup disusun ulang (perilaku lama).
- Tentor melihat setiap pengurang/penambah beserta alasannya di slip honor dan portal, serta menerima
  notifikasi; konfirmasi terima honor (D-11) mencakup baris penyesuaian.
- Semua langkah tercatat di audit trail keuangan (D-10).

### D-02 · Pembayaran CONFIRMED yang salah dibatalkan dengan reversal

**Aturan.**
- Pembayaran tidak pernah dihapus, dan `finance.payments.status` pembayaran asli **tidak diubah** (tetap
  `CONFIRMED`). Endpoint/alur yang saat ini bisa me-`reject` pembayaran `CONFIRMED` harus ditutup
  (temuan FIN-01).
- Tabel baru `finance.payment_reversals`: `payment_id` (FK RESTRICT ke pembayaran asli), `amount`,
  `reason` (wajib), `requested_by`, `requested_at`, `approved_by`, `approved_at`, `status`
  (`PENDING | APPROVED | REJECTED`), `reject_note`.
- Penyetuju ≠ pengaju (lihat Q-04). Satu pembayaran maksimal satu reversal `PENDING` dan satu `APPROVED`.
- Tahap pertama: **reversal penuh** sebesar `payments.total_amount` (lihat Q-05).
- **Perhitungan tagihan** (`InvoiceService::recalculate`): `paid_amount` = jumlah `payment_details.amount_paid`
  dari pembayaran `CONFIRMED` yang **tidak** punya reversal `APPROVED`. `remaining_amount` dan status
  (`UNPAID/PARTIAL/PAID`) diturunkan dari situ. Dipanggil di transaksi yang sama dengan persetujuan reversal,
  dengan `lockForUpdate` pada tagihan terkait.
- API dan UI menampilkan pembayaran asli dengan penanda "dibatalkan (reversal)" plus rincian reversal.
  Invoice PDF dan kartu tagihan orang tua menampilkan status hasil hitung ulang.

### D-03 · Pemisahan tugas payroll

> **Status: FINAL (2026-10-29).** Lembaga dijalankan **owner tunggal**; tidak ada orang lain untuk
> menyetujui (Q-14) maupun meninjau (Q-13). D-03 diimplementasikan dalam mode `single_operator` (D-11).
> Validasi "akun berbeda" tetap dibuat dan diuji untuk mode `separated`, tetapi tidak aktif.
> A-01 tetap dijalankan untuk memastikan data aktual (termasuk produksi bila diizinkan).
>
> **Fakta dari pemilik produk (2026-10-29):** peran `admin` dan `super_admin` dipegang **satu orang yang sama**.
> Pemisahan tugas antarorang tidak mungkin saat ini. Validasi "akun berbeda" di bawah hanya berlaku pada
> mode `separated` (D-11). Pada mode `single_operator`, berlaku kontrol pengganti D-11.
>
> Fakta yang sudah diketahui (DB pengembangan, 2026-10-29, read-only): **0** akun `super_admin`,
> **1** akun `admin` aktif; payroll yang ada disusun, disetujui, dan ditransfer oleh **1** akun yang sama.
> Seeder (`AdminUserSeeder.php:34`) membuat akun pertama sebagai `admin`, bukan `super_admin`.
> Data produksi belum diketahui.

**Peran per payroll** (dicatat di DB):
- **Penyusun** — akun yang terakhir menjalankan `generate` untuk payroll DRAFT itu. Tambah kolom
  `finance.payrolls.generated_by` + `generated_at`, diperbarui setiap kali DRAFT disusun ulang
  (`created_by` tetap = pembuat pertama). Ini mencegah celah "B menyetujui, lalu A menyusun ulang".
- **Penyetuju** — `approved_by` (sudah ada).
- **Pelaksana transfer** — `payroll_transfers.paid_by` (sudah ada), per transfer.

**Validasi server** (di `PayrollService`, pesan 422):
- `approve`: `Auth::id() ≠ generated_by`.
- `transfer`: `Auth::id() ≠ approved_by` **dan** `Auth::id() ≠ generated_by` (pemisahan tiga akun;
  lihat Q-06 bila jumlah admin kurang dari tiga).
- `approve` dan `transfer` mengunci baris payroll (`lockForUpdate`) dan memeriksa ulang status di dalam
  transaksi.
- Bukti transfer: `reference_no` **wajib** untuk setiap transfer. Tambah kolom `proof_path` (berkas privat,
  disimpan seperti materi; lihat Q-07 apakah wajib). `transfer_date`, `amount`, `paid_by` tetap.
- UI menonaktifkan tombol untuk akun yang tidak boleh, dengan penjelasan "Anda penyusun payroll ini".

### D-04 · Backup hanya untuk super admin

> **Prasyarat:** minimal satu akun `super_admin` aktif harus ada sebelum D-04 dirilis. Bila tidak, tidak ada
> satu pun akun yang bisa membuka backup/restore (kondisi DB pengembangan saat ini). Agent memeriksa di
> A-01 apakah ada jalur resmi membuat/menaikkan akun ke `super_admin` (seeder, UI Admin, artisan) dan
> melaporkannya; jalur baru hanya dibuat setelah disetujui.

- Seluruh grup route `admin/backups` (termasuk `status`, `settings`, `upload`, `verify`, `restore`,
  `download`, `destroy`) memakai `role:super_admin`. Akun `admin` mendapat **403**.
- Pengecualian terbatas: `BlockDuringRestore` tetap berlaku untuk semua peran; endpoint `status` tetap
  bisa dibaca super admin selama restore.
- Web: menu "Backup & Pemulihan" dan route `/admin/backups` hanya untuk `super_admin` (route guard, bukan
  hanya menyembunyikan menu). Akun `admin` yang membuka URL langsung diarahkan dengan pesan "tidak punya akses".
- Notifikasi backup/restore (`BackupService::notifyAdmins`) hanya dikirim ke `super_admin`.
- Backup terjadwal tetap berjalan dari cron. Perintah artisan `backup:*` tetap tersedia (akses shell server
  dianggap setara super admin); aktor yang dicatat diubah ke super admin pertama (lihat Q-09).

### D-05 · Sesi payroll tertunda ditinjau sebelum diproses

- `PayrollService::eligibleAttendances` hanya mengambil absensi tentor dengan `session_date` **di dalam
  bulan periode** (awal–akhir bulan), bukan lagi `<= akhir periode`.
- Absensi tentor `HADIR`, sesi `COMPLETED`, `is_payroll_processed = false`, dengan `session_date` sebelum
  awal periode → masuk **daftar pengecualian** (tabel baru `finance.payroll_exceptions`), tidak masuk
  payroll secara otomatis.
- Baris pengecualian berisi: `tentor_attendance_id` (unik), `session_id`, `tentor_id`, periode asli,
  hasil pemeriksaan otomatis (`checks` JSON), `status` (`OPEN | APPROVED | REJECTED`), `reviewed_by`,
  `reviewed_at`, `note`, `target_payroll_id`.
- **Pemeriksaan otomatis** yang wajib tercatat sebelum bisa disetujui: status sesi `COMPLETED`; absensi
  `HADIR`; periode asli sudah punya payroll atau belum; **tidak ada** `payroll_details` lain dengan
  `tentor_attendance_id` / `session_id`+`tentor_id` yang sama (anti duplikasi); tarif berlaku tersedia.
- Pengecualian `APPROVED` ikut disusun pada `generate` payroll berikutnya sebagai baris susulan, berlabel
  periode asli di `payroll_details.note`. Pengecualian `REJECTED` tidak pernah dibayar (tetap
  `is_payroll_processed = false`, dengan alasan).
- Peninjau ≠ penyusun payroll tujuan (konsisten dengan D-03).
- Daftar pengecualian dibuat/diperbarui saat `preview` dan `generate`, serta ditampilkan di halaman payroll.

### D-06 · Masa berlaku token 12 jam

- `config/sanctum.php` `expiration` = `720` (menit). Token juga dibuat dengan `expires_at = now()+12h`.
- Respons `/api/login` menambahkan `expires_at` (ISO 8601). Bentuk respons lain tidak berubah.
- Jadwalkan `sanctum:prune-expired --hours=24` harian di `routes/console.php`.
- Klien (web dan Android): 401 → hapus token, kembali ke halaman login dengan pesan "Sesi berakhir,
  silakan masuk lagi".
- **Dampak yang harus diumumkan:** 233 token yang ada (termasuk yang berumur > 12 jam) langsung tidak
  berlaku setelah rilis; semua pengguna login ulang.

### D-07 · Batas login gagal 5 kali per menit

- Hitung **percobaan gagal** (bukan semua request) dengan `RateLimiter`, kunci = **kombinasi identitas
  dan IP**: `login:` + `sha1(lower(trim(email)) . '|' . ip)`, maks **5 gagal / 60 detik** (Q-08 terjawab).
  Akibatnya pengguna lain di wifi yang sama tidak ikut terkunci.
- Risiko residual yang dicatat (bukan bagian keputusan, tidak diimplementasikan tanpa persetujuan baru):
  serangan dari banyak IP ke satu email, atau dari satu IP ke banyak email (*password spraying*), tidak
  tertahan oleh kunci kombinasi. Usulan tambahan untuk ditinjau kelak: batas longgar per email lintas IP
  dan per IP lintas email.
- Bila kunci penuh → **429** dengan header `Retry-After` dan body
  `{"success": false, "message": "Terlalu banyak percobaan masuk. Coba lagi dalam N detik.", "retry_after": N}`.
  Pengecekan dilakukan **sebelum** `Auth::attempt`, sehingga password benar pun ditolak selama terkunci.
- Login berhasil → hapus kunci kombinasi tersebut.
- Pesan gagal tetap generik ("Email atau password salah"), tidak membedakan email ada/tidak.
- Peluruhan dan konfigurasi memakai cache store aplikasi (saat ini `database`). Pastikan IP asli terbaca bila
  di belakang proxy (`trustProxies`, lihat H.1 baseline).
- Klien menampilkan pesan 429 dari server.

### D-08 · FK `academic.schedules`: RESTRICT/NO ACTION

- Kebijakan awal: setiap kolom FK di `academic.schedules` (`class_id`, `subject_id`, `tentor_id`,
  `learning_location_id`) punya **tepat satu** FK dengan `ON DELETE RESTRICT`. FK duplikat lain dibuang.
  Saat ini ada 8 FK (pasangan `fk_schedule_*` dan `fk_schedules_*`, aturan bercampur CASCADE / SET NULL /
  RESTRICT / NO ACTION).
- **Sebelum menulis migration**, agent wajib:
  1. Menghasilkan inventaris **seluruh** FK di semua schema (`pg_constraint`, `contype='f'`): tabel, kolom,
     tabel tujuan, `ON DELETE`/`ON UPDATE`, nama, dan menandai kolom yang punya > 1 FK.
  2. Menguji di `bimbel_test` perilaku **aktual** menghapus kelas, mapel, tentor, dan lokasi yang dipakai
     jadwal (catatan koreksi: baseline sebelumnya menyatakan hapus kelas "diblokir"; itu **belum diuji**.
     Kombinasi CASCADE + NO ACTION bisa jadi justru meng-cascade).
  3. Memeriksa apakah ada jalur aplikasi yang **bergantung** pada CASCADE/SET NULL saat ini (mis. hapus
     lokasi belajar), dan mengubahnya menjadi pengecekan eksplisit 422 sebelum migration.
  4. Melaporkan inventaris dan hasil uji untuk ditinjau. Duplikat di tabel lain **tidak** diubah tanpa
     keputusan baru.
- Migration memakai nama constraint eksplisit, `down()` mengembalikan definisi lama persis.

### D-09 · Maksimal satu pembayaran PENDING per tagihan

- Berlaku untuk pembayaran yang mencakup beberapa tagihan: bila **salah satu** tagihan sudah punya
  pembayaran `PENDING`, pengajuan baru ditolak 422 "Masih ada pembayaran yang menunggu verifikasi untuk
  tagihan {invoice_no}".
- Penegakan: di dalam transaksi, setelah `lockInvoices` (`lockForUpdate` tagihan, urut id agar tidak
  deadlock), periksa `payment_details` × `payments.status='PENDING'`. Semua jalur pembuatan pembayaran
  wajib lewat penguncian yang sama.
- Batasan DB: unique tidak bisa lintas tabel; lapisan DB ditunda (tanpa trigger, karena proyek tidak
  memakai trigger). Penguncian baris tagihan dianggap penegakan utama dan wajib diuji paralel.
- Pembayaran yang dicatat Admin langsung `CONFIRMED` saat ada `PENDING`: lihat Q-10.

### D-10 · Audit trail keuangan (turunan D-01, D-02, D-03, D-05)

- Tabel baru `logs.finance_audit_logs` (append-only): `id`, `entity_type`, `entity_id`, `action`,
  `actor_id`, `before` (jsonb), `after` (jsonb), `reason`, `ip_address`, `created_at`.
- Ditulis di transaksi yang sama untuk: terbit/batal tagihan, ajukan/setujui/tolak pembayaran,
  ajukan/setujui/tolak reversal, ajukan/setujui/tolak koreksi absensi, susun/setujui payroll, transfer
  honor, tinjau pengecualian payroll.
- Aplikasi tidak punya kode update/delete untuk tabel ini. Pencabutan hak `UPDATE/DELETE` di level DB
  termasuk temuan DB-01 (akun DB terpisah), di luar lingkup tahap ini.
- Endpoint baca (super admin & admin, paginasi, filter entity/aktor/tanggal). Tanpa endpoint tulis.
- **Backup/restore (diputuskan 2026-10-29):** tabel audit ikut backup dan ikut kembali ke kondisi backup saat
  restore (sama dengan data lain). Entri sesudah titik backup tetap ada di backup PRE_RESTORE.

---

### D-12 · Akun super admin pertama dibuat saat setup awal database (Q-12 terjawab)

- `AdminUserSeeder` membuat akun pertama dari `SEED_ADMIN_EMAIL`/`SEED_ADMIN_PASSWORD` dengan peran
  **`super_admin`** (bukan `admin`), **hanya bila belum ada satu pun `super_admin`**. Seeder tetap aman
  dijalankan ulang dan tidak pernah mengubah peran akun yang sudah ada.
- Setelah setup awal, hanya akun `super_admin` yang bisa membuat atau menaikkan akun ke `super_admin`
  (jalur menu Pengguna yang sudah ada, `UserController.php:82,240`, dipertahankan, Q-17). Akun `admin`
  tidak pernah bisa.
- `DEPLOY.md` langkah 2 diperbarui: akun dari seeder adalah super admin.
- **Instalasi yang sudah berjalan** (DB pengembangan saat ini: 0 super admin, 1 admin milik owner) tidak
  tercakup oleh "setup awal". Lihat Q-15; T4 (D-04) tidak boleh dirilis ke instalasi itu sebelum Q-15 diputuskan,
  karena backup akan terkunci untuk semua akun.

### D-11 · Mode operator tunggal dan kontrol pengganti (DISETUJUI 2026-10-29, tanpa perubahan)

> Tidak ada peninjau di luar sistem (Q-13) dan tidak ada akun penyetuju lain (Q-14). Konsekuensi:
> - Butir 6 (laporan bulanan) tetap dibuat, tetapi berfungsi sebagai **arsip dan alat tinjau-diri owner**,
>   bukan kontrol independen.
> - **Konfirmasi terima honor oleh tentor** dan **notifikasi reversal ke orang tua** (butir 5) menjadi
>   satu-satunya verifikasi oleh pihak di luar operator. Keduanya wajib, bukan opsional.
> - Risiko residual (operator tunggal dapat melakukan tindakan tidak sah yang hanya terdeteksi, tidak
>   tercegah) **diterima oleh owner** dan dicantumkan di laporan Release Readiness.

**Latar.** Satu orang memegang `admin` dan `super_admin`. Semua aturan "penyetuju ≠ pengaju" (D-01 koreksi
absensi, D-02 reversal, D-03 payroll, D-05 pengecualian) akan memblokir operasional bila ditegakkan apa
adanya. Membuat akun kedua untuk orang yang sama **tidak** memenuhi pemisahan tugas dan **dilarang**
dipakai sebagai solusi.

**Konfigurasi.** `config/finance.php` → `approval_mode` = `single_operator` | `separated`
(env `FINANCE_APPROVAL_MODE`, bawaan `single_operator`). Perpindahan mode tidak butuh perubahan kode.
- `separated`: aturan akun berbeda di D-01, D-02, D-03, D-05 ditegakkan penuh.
- `single_operator`: persetujuan oleh akun yang sama **diizinkan**, tetapi wajib melalui kontrol pengganti
  di bawah. Persetujuan seperti itu ditandai `self_approved = true` di catatan terkait dan di audit trail.

**Kontrol pengganti (mode `single_operator`)**, ditegakkan di server:
1. **Konfirmasi ulang password** di setiap langkah persetujuan: approve payroll, transfer honor, setujui
   reversal, setujui koreksi absensi, setujui pengecualian payroll. Password salah → 422, tercatat.
2. **Alasan tertulis wajib** untuk setiap persetujuan diri sendiri (min. 10 karakter).
3. **Tahapan tetap terpisah secara waktu dan tindakan**: payroll tetap DRAFT → APPROVED → transfer
   sebagai tiga aksi berbeda. Tidak ada tombol "setujui dan bayar sekaligus".
4. **Bukti transfer honor wajib**: `reference_no` **dan** berkas bukti (mengubah bawaan Q-07).
5. **Verifikasi pihak luar**:
   - Tentor mengonfirmasi "honor diterima" atau melaporkan "belum diterima / nominal tidak sesuai" di
     portal tentor (web & Android) per transfer. Laporan ketidaksesuaian masuk audit trail dan notifikasi.
   - Orang tua menerima notifikasi bila pembayaran mereka di-reversal (dengan nominal dan alasan), dan
     melihat riwayat reversal di kartu tagihan.
6. **Laporan tinjauan berkala**: PDF bulanan semua aksi keuangan `self_approved` (payroll, transfer,
   reversal, koreksi, pengecualian) beserta konfirmasi/penolakan tentor, untuk ditinjau pihak di luar sistem
   (lihat Q-13). Unduhan laporan tercatat.
7. **Audit trail append-only** (D-10) mencatat mode yang berlaku saat aksi terjadi.

**Batas yang harus diakui.** Kontrol pengganti mendeteksi dan mempersulit kesalahan atau penyalahgunaan,
tetapi **tidak mencegah** pemegang tunggal melakukan tindakan yang tidak sah. Risiko residual ini
diterima secara sadar oleh pemilik produk, dan dicatat di laporan rilis.

### A-01 · Inventaris aktor keuangan (tahap analisis T0, READ-ONLY)

Dijalankan di setiap lingkungan yang tersedia (pengembangan; produksi **hanya** bila pemilik produk
memberi akses dan izin eksplisit). Hanya `SELECT`; tidak ada perubahan data, akun, atau peran.
Laporan memakai **jumlah dan ID tersamar** (mis. `admin#1`), tanpa nama, email, atau nomor telepon.

1. Jumlah akun per peran `super_admin` dan `admin`: aktif, nonaktif, dan aktif yang tokennya dipakai
   dalam 30 dan 90 hari terakhir (`personal_access_tokens.last_used_at`).
2. Riwayat aktor payroll: per payroll, apakah `created_by`, `approved_by`, dan setiap
   `payroll_transfers.paid_by` sama atau berbeda (jumlah payroll per pola: 1 orang / 2 orang / 3 orang).
3. Riwayat aktor pembayaran: jumlah akun berbeda di `payments.received_by` dan `submitted_by` (peran admin).
4. Jalur pembuatan/penaikan akun `super_admin` yang ada di kode (seeder, `UserController`, artisan),
   termasuk apakah admin biasa bisa membuat super admin.
5. Kesimpulan teknis: model pemisahan tugas mana yang **bisa dijalankan** dengan jumlah akun saat ini
   (tiga akun / dua orang / tidak mungkin), tanpa memutuskan kebijakan.

**Yang tidak bisa diketahui dari data** dan wajib ditanyakan ke pemilik produk: berapa **orang** (bukan
akun) yang benar-benar tersedia dan berwenang untuk menyusun, menyetujui, dan mentransfer payroll, dan
apakah ada orang yang memakai lebih dari satu akun. Satu orang dengan dua akun tidak memenuhi pemisahan
tugas walau sistem melihat dua akun berbeda.

Keluaran A-01 menjadi dasar keputusan final Q-06 dan D-03. Tahap T8 tidak dimulai sebelum keduanya final.

---

## 3. Perubahan model data (migration baru)

Semua migration diuji `up` → `down` → `up` di `bimbel_test`, termasuk pada salinan hasil restore backup terbaru.

| ID | Tahap | Isi | Catatan |
|---|---|---|---|
| M-01 | T6 | `logs.finance_audit_logs` | index (`entity_type`,`entity_id`), (`actor_id`), (`created_at`) |
| M-02 | T7 | `finance.payment_reversals` | FK RESTRICT ke `payments` dan `master.users`; partial unique `payment_id WHERE status IN ('PENDING','APPROVED')` |
| M-03 | T8 | `finance.payrolls.generated_by`, `generated_at`; `finance.payroll_transfers.proof_path` | isi awal `generated_by = created_by` untuk data lama |
| M-04 | T8 | `finance.payroll_exceptions` | unique `tentor_attendance_id`; FK RESTRICT |
| M-05 | T9 | `academic.attendance_corrections` | partial unique `student_attendance_id WHERE status='PENDING'` |
| M-06 | T9 | `invoices.invoice_type` + `adjusts_invoice_id`; ubah partial unique index periode agar khusus `REGULAR`; `finance.refunds`; `finance.credit_notes`; `finance.credit_applications`; `finance.payroll_recoveries`; jenis baris penyesuaian di `payroll_details` | perubahan index eksisting: buat index baru dulu, baru buang yang lama, dalam satu migration; cek apakah CHECK/kolom `payroll_details` mengizinkan subtotal negatif |
| M-07 | T10 | CHECK `payments.total_amount > 0`, `payment_details.amount_paid > 0` | cek data pelanggar dulu (dev: 0 baris) |
| M-08 | T10 | FK `invoice_items.fee_rule_id`, `payroll_details.fee_rule_id` → `finance.fee_rules` `ON DELETE RESTRICT` | `NOT VALID` lalu `VALIDATE CONSTRAINT`; cek yatim dulu (dev: 0) |
| M-09 | T10 | Dedup FK `academic.schedules` | hanya setelah D-08 langkah 1–4 ditinjau |

Tidak perlu migration: D-04, D-06 (`personal_access_tokens.expires_at` sudah ada), D-07, D-09.

---

## 4. Perubahan kontrak API

| Endpoint | Perubahan | Klien terdampak |
|---|---|---|
| `POST /api/login` | 429 + `Retry-After` + `retry_after`; field baru `expires_at`; 401 untuk akun/profil nonaktif | web, Android |
| Semua route ber-auth | 401 bila token > 12 jam, user nonaktif, atau profil peran nonaktif | web, Android |
| `admin/backups/*` | 403 untuk `admin` | web |
| Pembayaran (submit orang tua, approve/reject admin) | 422 baru: PENDING ganda; reject atas CONFIRMED ditolak | web, Android (orang tua) |
| Reversal (baru) | `POST admin/payments/{payment}/reversals`, `PATCH admin/payment-reversals/{id}/approve`, `.../reject`, `GET` daftar | web |
| Payroll | 422 pemisahan tugas; `reference_no` wajib di transfer; `proof_path` opsional/wajib (Q-07); field `generated_by` di detail | web |
| Pengecualian payroll (baru) | `GET admin/payroll-exceptions`, `PATCH .../{id}/approve`, `.../reject` | web |
| Absensi siswa | 422 baris terkunci (Admin & tentor) | web, Android (tentor) |
| Koreksi absensi (baru) | `POST admin/attendance-corrections`, `GET`, `PATCH .../{id}/approve`, `.../reject` | web |
| Audit log (baru) | `GET admin/finance-audit-logs` | web |

Nama route final mengikuti pola `routes/api.php` yang ada; agent melaporkan daftar final di tahap terkait.

---

## 5. Katalog test penerimaan

Semua test adalah feature test Laravel di PostgreSQL uji (T1). Setiap ID wajib ada sebagai test bernama.

**Autentikasi (T2)**
- AT-01 Lima login gagal (email + IP sama) dalam 60 dtk → percobaan ke-6 = 429 + `Retry-After`, walau password benar.
- AT-02 Email sama dari IP lain, dan email lain dari IP sama → **tidak** terkunci (sesuai desain kombinasi).
- AT-03 Setelah 60 dtk (waktu di-*travel*), login berhasil; login sukses menghapus kunci kombinasi.
- AT-04 Pesan gagal identik untuk email terdaftar dan tidak terdaftar.
- AT-05 Token berumur 12 j 1 m → 401; 11 j 59 m → 200. `expires_at` ada di respons login.
- AT-06 Tentor dinonaktifkan → token lama 401 (sebelumnya 200, D-1 audit); login 401.
- AT-07 Siswa dinonaktifkan → token lama 401; login 401 (sebelumnya 200, D-2 audit).
- AT-08 Orang tua dinonaktifkan → sama seperti AT-06.
- AT-09 Admin aktif tanpa profil peran tetap bisa login dan mengakses.
- AT-10 Regresi: U-1..3, R-1..4, I-1..9 dari audit tetap lulus.

**Backup (T4)**
- AT-20 Token `admin` → 403 untuk setiap route `admin/backups/*` (iterasi daftar route, bukan sampel).
- AT-21 Token `super_admin` → perilaku lama tetap (index, verify, restore dengan password salah = 422).
- AT-22 Notifikasi backup hanya diterima `super_admin`.

**Pembayaran (T5, T7)**
- AT-30 Approve lalu reject dengan data basi (F-1 audit) → reject ditolak 422; status pembayaran & tagihan konsisten.
- AT-31 Dua pengajuan bukti bayar untuk tagihan sama → yang kedua 422; DB berisi satu PENDING.
- AT-32 Dua pengajuan **paralel** (dua proses/koneksi) → tepat satu PENDING.
- AT-33 Pembayaran multi-tagihan ditolak bila salah satu tagihan punya PENDING.
- AT-34 Regresi F-2..F-4 audit (overpay ditolak, generate ganda, unique DB).
- AT-35 Race generate tagihan / transfer ganda → 422 berpesan, bukan 500 (FIN-05).
- AT-40 Reversal diajukan A, disetujui A → 422.
- AT-41 Reversal disetujui B → pembayaran asli tetap `CONFIRMED`, tagihan kembali `UNPAID`/`PARTIAL` sesuai sisa; `paid_amount` = total pembayaran valid.
- AT-42 Reversal kedua untuk pembayaran sama → 422.
- AT-43 Reversal tanpa alasan → 422.
- AT-44 Audit log memuat ajukan + setujui dengan aktor, nominal, waktu.

**Payroll (T8)** (AT-50..53 dijalankan pada mode `separated`; AT-59a..e pada mode `single_operator`)
- AT-59a Mode tunggal: A menyusun lalu menyetujui tanpa password ulang → 422; dengan password + alasan → 200, `self_approved = true`.
- AT-59b Mode tunggal: transfer tanpa berkas bukti atau tanpa `reference_no` → 422.
- AT-59c Tentor mengonfirmasi terima / melaporkan ketidaksesuaian → tercatat di audit trail; laporan memicu notifikasi.
- AT-59d Laporan bulanan memuat semua aksi `self_approved` bulan itu, tidak lebih dan tidak kurang.
- AT-59e Mengganti `FINANCE_APPROVAL_MODE` ke `separated` → AT-50..53 lulus tanpa perubahan kode.
- AT-50 A menyusun, A menyetujui → 422.
- AT-51 A menyusun, B menyetujui, B mentransfer → 422; A mentransfer → 422 (mode tiga akun); C mentransfer → 200.
- AT-52 A menyusun, B menyetujui; percobaan susun ulang setelah APPROVED → ditolak (perilaku lama).
- AT-53 B menyusun ulang DRAFT buatan A → `generated_by` = B; B tidak bisa menyetujui.
- AT-54 Transfer tanpa `reference_no` → 422.
- AT-55 Absensi HADIR bulan lalu yang belum diproses **tidak** masuk payroll bulan ini; muncul di pengecualian dengan hasil pemeriksaan.
- AT-56 Pengecualian disetujui → masuk payroll berikutnya sebagai baris susulan berlabel periode asli; tidak ganda bila `generate` dijalankan dua kali.
- AT-57 Pengecualian untuk sesi yang sudah ada di `payroll_details` → pemeriksaan anti-duplikasi gagal, tidak bisa disetujui.
- AT-58 Pengecualian ditolak → tidak pernah dibayar.

**Absensi (T9)**
- AT-60 Setelah tagihan bulan itu terbit, ubah absensi siswa (Admin) → 422 (F-5 audit, sebelumnya 200).
- AT-61 Setelah payroll memproses sesi, ubah absensi siswa (tentor) → 422.
- AT-62 Tagihan bulan itu `CANCELLED` → absensi tidak terkunci oleh syarat (a).
- AT-63 Koreksi tanpa alasan → 422; pengaju menyetujui sendiri → 422.
- AT-64 Koreksi disetujui → absensi berubah; `invoices`, `invoice_items`, `payroll_details` lama **byte-identik** dengan sebelum koreksi; catatan penyesuaian baru dibuat sesuai `financial_effect`.
- AT-65 `financial_effect` memakai tarif snapshot walau tarif aktif sudah diubah.
- AT-66 Kurang tagih → tagihan `ADJUSTMENT` terbit dengan `adjusts_invoice_id`; generate bulanan tetap tidak menggandakan `REGULAR`.
- AT-67 Lebih tagih, tagihan lunas, pilih `REFUND` → refund tercatat dengan bukti; refund > bagian yang sudah dibayar → 422.
- AT-68 Lebih tagih, pilih `CREDIT` → kredit otomatis terpakai di tagihan `REGULAR` berikutnya; sisa kredit dibawa.
- AT-69 Lebih tagih pada tagihan belum lunas → bagian belum dibayar langsung jadi kredit ke tagihan itu; status dihitung ulang benar.
- AT-69a Honor lebih bayar, pilih `DEDUCT` → baris pengurang di payroll berikutnya; total transfer tidak negatif; sisa dibawa.
- AT-69b Honor lebih bayar, pilih `REFUND_REQUEST` → `payroll_recoveries` OPEN; konversi ke `DEDUCT` berfungsi.
- AT-69c Honor kurang bayar → muncul di pengecualian payroll berikutnya.

**Super admin (T4)**
- AT-23 `db:seed` di DB kosong → akun pertama `super_admin`; dijalankan ulang → tidak ada akun/peran yang berubah.
- AT-24 Akun `admin` tidak bisa membuat/menaikkan akun ke `super_admin` (lihat Q-17: super admin saat ini **bisa** lewat menu Pengguna).

**Database (T10)**
- AT-70 Insert pembayaran nominal 0 → ditolak DB.
- AT-71 `fee_rule_id` acak → ditolak DB.
- AT-72 Perilaku hapus kelas/mapel/tentor/lokasi yang dipakai jadwal = ditolak (RESTRICT), dibandingkan dengan hasil uji pra-migration.
- AT-73 `migrate:rollback` setiap migration baru berhasil dan skema kembali identik (bandingkan dump skema).

---

## 6. Urutan tahap

| Tahap | Isi | Butuh migration | Prasyarat |
|---|---|---|---|
| T0 | Backup terverifikasi + salinan luar disk; buat `bimbel_test`; inventaris aktor A-01 (read-only) | — | persetujuan dokumen ini |
| T1 | Infrastruktur test PostgreSQL (`phpunit.xml` / `.env.testing`, trait DB uji), tulis test AT-xx yang mereproduksi temuan (diharapkan **gagal**) | hanya di DB uji | T0 |
| T2 | D-06, D-07, akun nonaktif (SEC-02) + penyesuaian klien web & Android | — | T1 |
| T3 | Upgrade dependensi (SEC-03), hapus `maatwebsite/excel` & `spatie/laravel-permission` | — | T1 (regresi) |
| T4 | D-12 seeder super admin, lalu D-04 backup super admin | — | T1, Q-15 diputuskan, minimal 1 `super_admin` aktif di setiap instalasi yang dirilis |
| T5 | FIN-01 (lock approve/reject), D-09, FIN-05 | — | T1 |
| T6 | D-10 audit trail | M-01 | T5 |
| T7 | D-02 reversal | M-02 | T6 |
| T8 | D-11 (mode + kontrol pengganti), D-03 + D-05 payroll, konfirmasi terima honor oleh tentor | M-03, M-04, kolom `self_approved` + konfirmasi tentor | T6, hasil A-01 |
| T9 | D-01 kunci + koreksi absensi | M-05, M-06 | T6, T8, jawaban Q-01–Q-03 |
| T10 | D-08 + constraint (DB-02, nominal > 0) | M-07..M-09 | inventaris FK ditinjau |
| T11 | Android release (MOB-01/02) | — | domain & keystore dari pemilik |
| T12 | XSS artikel (SEC-05), SEC-06, LOW-01..05 | — | T1 |

Status rilis hanya boleh dinilai ulang setelah T2–T5 dan T11 selesai.

---

## 7. Pertanyaan terbuka (dengan nilai bawaan sementara)

Agent memakai nilai bawaan **hanya** bila pemilik produk menyetujui dokumen ini tanpa mengubahnya.

| ID | Pertanyaan | Nilai bawaan usulan |
|---|---|---|
| Q-01 | Lebih tagih: refund atau kredit? | **TERJAWAB:** operator memilih per koreksi (D-01) |
| Q-02 | Kurang tagih: tagihan penyesuaian terpisah? | **TERJAWAB:** ya, `ADJUSTMENT` (D-01) |
| Q-03 | Honor yang sudah dibayar berubah | **TERJAWAB:** pengurang honor bulan berikutnya atau tawarkan pengembalian (D-01) |
| Q-04 | Siapa yang boleh menyetujui reversal dan koreksi absensi? | Admin atau super admin. Mode `separated`: ≠ pengaju. Mode `single_operator`: boleh sama, dengan kontrol D-11 |
| Q-05 | Perlu reversal **sebagian**? | Tidak di tahap ini; hanya reversal penuh, lalu catat pembayaran baru yang benar |
| Q-06 | Jumlah orang untuk tugas payroll | **TERJAWAB:** 1 owner. Mode `single_operator`. Aturan mode `separated` (tiga akun) dibuat tetapi tidak aktif; ditinjau ulang bila ada orang kedua |
| Q-13 | Peninjau laporan bulanan di luar sistem | **TERJAWAB:** tidak ada. Laporan = arsip/tinjau-diri |
| Q-14 | Akun khusus penyetuju | **TERJAWAB:** tidak ada; peran `penyetuju` tidak dibuat |
| Q-12 | Akun `super_admin` pertama | **TERJAWAB:** dibuat saat setup awal database lewat seeder (D-12) |
| Q-15 | Instalasi yang **sudah berjalan** tanpa super admin (DB pengembangan; produksi bila sudah ada): akun admin milik owner dinaikkan ke `super_admin` lewat perintah terminal sekali jalan (dengan konfirmasi dan tercatat), atau DB disetup ulang? | Perintah terminal sekali jalan `user:promote-super-admin {email}`, hanya jalan bila belum ada super admin. Butuh persetujuan karena mengubah hak akses akun |
| Q-16 | Siapa yang memilih refund/kredit saat lebih tagih, dan apakah pilihan orang tua perlu dicatat? | **Disetujui (bawaan):** operator memilih; kolom catatan "permintaan orang tua" opsional |
| Q-15 | Instalasi berjalan tanpa super admin | **Selesai untuk DB pengembangan:** owner membuat akun `super_admin` sendiri (2026-10-29) |
| Q-17 | A-01 menemukan `UserController` mengizinkan **super admin** membuat akun `super_admin` (admin biasa tidak bisa, `UserController.php:82,240`). D-12 menulis "tidak ada jalur di UI/API". Tutup jalur ini, atau pertahankan? | **TERJAWAB:** dipertahankan (hanya super admin); D-12 dan AT-24 sudah diubah |

### Implementasi T9 yang berbeda dari rancangan (2026-10-29)

- Tagihan penyesuaian dibuat **tanpa periode bulan** (`period_month` NULL) dan merujuk tagihan asli lewat
  `adjusts_invoice_id`. Indeks unik tagihan per periode yang ada **tidak diubah** (lebih aman dari rancangan M-06).
- Honor kurang bayar dari koreksi dicatat sebagai `payroll_adjustments` jenis ADDITION, bukan lewat
  `payroll_exceptions` (absensi tentornya sudah diproses, sehingga tidak cocok dengan pengecualian D-05).
- Refund dicatat sekaligus saat koreksi disetujui (metode + bukti wajib), bukan dua langkah.

### Temuan tambahan selama T0–T1

- **DB-08 (LOW):** `config/database.php` koneksi `pgsql`: `'search_path' => 'public','master','academic','website',` ditulis sebagai elemen array terpisah, sehingga `search_path` efektif hanya `public`. Tidak berdampak pada query (tabel memakai nama schema lengkap), tetapi `migrate:fresh`/`db:wipe` bawaan tidak membersihkan schema aplikasi. Test memakai prosedur pengosongan sendiri. Perbaikan butuh keputusan karena mengubah perilaku koneksi.
- **SEC-03 tambahan:** `spatie/laravel-permission` 8.0.0 terpasang tetapi tidak dipakai, dihapus di T3 bersama `maatwebsite/excel`.
| Q-07 | Berkas bukti transfer honor wajib atau cukup nomor referensi? | **TERJAWAB via D-11:** `reference_no` dan berkas bukti keduanya wajib |
| Q-08 | Batas login gagal | **TERJAWAB:** 5 gagal/menit per kombinasi email + IP, respons 429 (D-07) |
| Q-09 | Restore lewat terminal: aktor tercatat siapa? | Super admin pertama, plus catatan "via terminal" di log |
| Q-10 | Admin mencatat pembayaran tunai `CONFIRMED` saat ada `PENDING` untuk tagihan yang sama: boleh? | Ditolak sampai PENDING diputuskan |
| Q-11 | Siswa nonaktif: masih boleh melihat riwayat nilai, atau seluruh akses ditutup? Orang tua dari siswa nonaktif? | Siswa: akses ditutup. Orang tua tetap aktif (data tagihan tetap bisa dilihat) |
