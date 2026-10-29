# Deploy Bimbel Reng Kraksaan

Panduan memasang aplikasi di server baru atau memperbarui server yang sudah berjalan.
Untuk urutan lengkap memasang server lokal sampai subdomain Cloudflare aktif (lewat Cloudflare Tunnel, tanpa membuka port router), ikuti [docs/SERVER-SETUP.md](docs/SERVER-SETUP.md).

| Bagian | Folder | Teknologi |
|---|---|---|
| Backend API | `bimbel-api` | Laravel 11, PHP ≥ 8.3, PostgreSQL ≥ 14 |
| Frontend | `bimbel-web` | React + Vite (hasil build berupa file statis) |
| Aplikasi Android | `bimbel-android` | Flutter (APK rilis, wajib HTTPS) |

## 1. Database (PostgreSQL)

Buat database dan user. User tersebut harus pemilik database, karena migration membuat schema
(`master`, `academic`, `website`, `exam`, `finance`, `logs`) dan extension `uuid-ossp`.

```sql
CREATE USER bimbel_user WITH PASSWORD 'ganti-password-kuat';
CREATE DATABASE bimbel_kraksaan_db OWNER bimbel_user;
```

Jika user bukan superuser, aktifkan extension sekali sebagai superuser:

```sql
\c bimbel_kraksaan_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
```

## 2. Backend (`bimbel-api`)

```bash
cd bimbel-api
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate
```

Isi `.env`:

- `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL` = alamat API
- `DB_*` sesuai langkah 1
- `SEED_ADMIN_EMAIL` dan `SEED_ADMIN_PASSWORD` untuk akun pertama (dibuat sebagai **Super Admin**)

Lalu buat seluruh tabel dan data acuan:

```bash
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
php artisan config:cache && php artisan route:cache
```

- **`migrate`** membuat semua tabel dari nol. Migration pertama
  (`2026_06_01_000000_create_base_schema_tables`) berisi tabel inti yang dulu dibuat manual.
- **`db:seed`** mengisi peran login, jenjang kelas, paket bimbingan, profil lembaga, dan akun pertama.
  Akun pertama dibuat sebagai Super Admin bila belum ada Super Admin; peran akun yang sudah ada tidak diubah.
  Seeder aman dijalankan ulang (tidak menggandakan data). Jika `SEED_ADMIN_PASSWORD` kosong,
  password acak ditampilkan sekali di terminal.
- **`storage:link`** diperlukan agar gambar website (banner, logo, artikel) bisa diakses.
  Berkas materi belajar disimpan privat di `storage/app/private/materials`
  dan hanya dibuka lewat API ber-login.

Folder `storage/` dan `bootstrap/cache/` harus bisa ditulis oleh user web server.

## 3. Frontend (`bimbel-web`)

```bash
cd bimbel-web
npm ci
cp .env.example .env    # isi VITE_API_URL = alamat backend tanpa /api
npm run build
```

Sajikan isi folder `dist/` sebagai situs statis. Karena memakai React Router, semua path
diarahkan ke `index.html`. Contoh untuk Nginx:

```nginx
location / {
    try_files $uri /index.html;
}
```

`VITE_API_URL` dibaca saat build. Setelah mengubahnya, jalankan `npm run build` lagi.

## 4. Penjadwal & Backup

Backup otomatis (menu **Pengaturan → Backup & Pemulihan**, hanya untuk **Super Admin**) dijalankan oleh penjadwal Laravel.
Pasang satu baris cron untuk user web server (mis. `www-data`):

```cron
* * * * * cd /path/ke/bimbel-api && php artisan schedule:run >> /dev/null 2>&1
```

Halaman Backup menampilkan peringatan bila cron ini belum berjalan. Penjadwal yang sama juga
membersihkan token login kedaluwarsa setiap hari.

**Keamanan login:**

- Isi `CORS_ALLOWED_ORIGINS` dengan alamat web (mis. `https://bimbel.bolinggo.org`) agar API hanya bisa
  dipanggil dari web lembaga. Kosong = semua origin (hanya untuk pengembangan).
- Token login berlaku 12 jam (`SANCTUM_EXPIRATION`, menit). Setelah itu pengguna diminta masuk lagi.
- Setelah 5 kali gagal dalam 1 menit untuk email + alamat IP yang sama, login ditolak (HTTP 429) selama
  1 menit. Penghitung disimpan di cache aplikasi (`CACHE_STORE`).
- Bila API berada di belakang proxy/load balancer lain (bukan Nginx langsung ke PHP-FPM), atur
  *trusted proxies* agar IP asli pengguna terbaca. Tanpa itu, semua pengguna terlihat ber-IP sama dan
  batas login berlaku per email saja.

- **Program PostgreSQL client** (`pg_dump`, `pg_restore`, `psql`) harus terpasang dengan versi
  sama atau lebih baru dari server database: `sudo apt install postgresql-client-16`.
  Pemulihan ditolak bila versinya belum memuat perbaikan keamanan `\restrict`
  (minimal 17.6 / 16.10 / 15.14 / 14.19 / 13.22); perbarui dengan `sudo apt upgrade postgresql-client-16`.
  Lokasi lain dapat diatur lewat `BACKUP_PG_DUMP`, `BACKUP_PG_RESTORE`, `BACKUP_PSQL` di `.env`.
- **Lokasi arsip:** `storage/app/backups` (tidak bisa diakses dari web). Ubah lewat `BACKUP_PATH`,
  sebaiknya ke disk lain dari database. Unduh salinan secara berkala ke luar server.
- **Unggah backup** dari server lain dibatasi `upload_max_filesize` dan `post_max_size` PHP
  (serta `client_max_body_size` Nginx). Naikkan sesuai ukuran arsip, mis. `512M`.
- **Proses panjang:** backup & pemulihan berjalan setelah respons dikirim. Pastikan
  `request_terminate_timeout` PHP-FPM tidak terlalu kecil (mis. `0` atau `1800`).

Perintah darurat dari terminal (bila halaman Admin tidak bisa dibuka):

```bash
php artisan backup:run                 # backup manual (database + berkas)
php artisan backup:restore --list      # daftar backup
php artisan backup:restore <nama-berkas.zip>   # pulihkan (minta ketik PULIHKAN)
```

**Pindah server:** pasang aplikasi seperti langkah 1–3 (`migrate` + `db:seed`), salin berkas
`.zip` dari server lama lalu jalankan `php artisan backup:restore /path/berkas.zip`, atau unggah lewat menu Backup lalu pulihkan.

## 5. Domain & Cloudflare

Subdomain yang dipakai lembaga ini:

| Subdomain | Isi | `.env` |
|---|---|---|
| `bimbel.bolinggo.org` | Web (`bimbel-web/dist`) | `VITE_API_URL=https://api-bimbel.bolinggo.org` saat build web |
| `api-bimbel.bolinggo.org` | API Laravel | `APP_URL=https://api-bimbel.bolinggo.org`, `CORS_ALLOWED_ORIGINS=https://bimbel.bolinggo.org` |

**Server lokal tanpa membuka port router (dipakai lembaga ini): Cloudflare Tunnel.** Langkah lengkap di
[docs/SERVER-SETUP.md](docs/SERVER-SETUP.md). Intinya:

1. Nginx hanya mendengar `127.0.0.1:80`; `cloudflared` meneruskan kedua subdomain ke sana. Record DNS lain
   milik `bolinggo.org` tidak diubah.
2. IP asli pengguna (wajib untuk batas login per pengguna): `set_real_ip_from 127.0.0.1;` +
   `real_ip_header CF-Connecting-IP;` di Nginx.
3. `fastcgi_param HTTPS on;` di blok API, karena tunnel → Nginx memakai HTTP lokal.
4. SSL/TLS mode **Full**, *Always Use HTTPS* aktif. Tidak perlu sertifikat di server.
5. Firewall: tutup semua koneksi masuk kecuali SSH dari LAN.

**Alternatif bila kelak memakai VPS (IP publik):** record `A` *Proxied* untuk kedua subdomain; mode
**Full (strict)** dengan Origin Certificate di Nginx; `set_real_ip_from` berisi daftar IP Cloudflare
(https://www.cloudflare.com/ips/); firewall port 80/443 hanya dari IP Cloudflare.

Paket gratis Cloudflare membatasi body permintaan 100 MB. Unggah backup yang lebih besar langsung di server
(`php artisan backup:restore /path/berkas.zip`).

## 6. Aplikasi Android (`bimbel-android`)

Build rilis **wajib** memakai kunci rilis sendiri dan alamat API **HTTPS**; tanpa keduanya build dihentikan
dengan pesan jelas. Build debug tetap boleh memakai HTTP ke server lokal.

**Sekali saja — buat kunci rilis** (simpan di luar repository, mis. `~/keys/`):

```bash
keytool -genkeypair -v -keystore ~/keys/bimbel-reng-release.jks -alias bimbel-reng \
  -keyalg RSA -keysize 2048 -validity 10000
```

Lalu buat `bimbel-android/android/key.properties` (sudah di-ignore git):

```properties
storeFile=/home/USER/keys/bimbel-reng-release.jks
storePassword=PASSWORD_KEYSTORE
keyAlias=bimbel-reng
keyPassword=PASSWORD_KUNCI
```

> **Simpan cadangan berkas `.jks` dan kedua password di tempat aman (mis. penyimpanan terenkripsi).**
> Bila hilang, pembaruan aplikasi tidak bisa dipasang di atas versi lama; pengguna harus uninstall dulu.

**Build APK rilis:**

```bash
cd bimbel-android
flutter build apk --release --dart-define=API_URL=https://api-bimbel.bolinggo.org
# hasil: build/app/outputs/flutter-apk/app-release.apk
```

APK yang dulu ditandatangani kunci debug tidak bisa diperbarui dengan APK rilis: pengguna perlu uninstall versi
lama satu kali sebelum memasang versi rilis.

## Memperbarui server yang sudah berjalan

```bash
git pull
cd bimbel-api && composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache && php artisan route:cache
cd ../bimbel-web && npm ci && npm run build
```

Migration aman dijalankan pada database yang sudah berisi data. Migration baseline dan penyelaras
skema tidak mengubah apa pun pada database yang tabelnya sudah ada.

## Catatan

- **Seeder:** `php artisan db:seed` juga aman di server yang sudah berjalan,
  tetapi biasanya tidak diperlukan lagi.
- **Tarif tentor:** awalnya Rp 0. Atur di **Keuangan → Honor Tentor → Tarif Tentor**
  sebelum menyetujui payroll.
- **Mode gelap:** jika menambah kelas warna Tailwind baru dan tampilannya salah di mode gelap,
  jalankan `python3 scripts/gen-dark-theme.py src` di folder `bimbel-web`.
