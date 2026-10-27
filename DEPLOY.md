# Deploy Bimbel Reng Kraksaan

Panduan memasang aplikasi di server baru atau memperbarui server yang sudah berjalan.

| Bagian | Folder | Teknologi |
|---|---|---|
| Backend API | `bimbel-api` | Laravel 11, PHP ≥ 8.3, PostgreSQL ≥ 14 |
| Frontend | `bimbel-web` | React + Vite (hasil build berupa file statis) |

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
- `SEED_ADMIN_EMAIL` dan `SEED_ADMIN_PASSWORD` untuk akun admin pertama

Lalu buat seluruh tabel dan data acuan:

```bash
php artisan migrate --force
php artisan db:seed --force
php artisan storage:link
php artisan config:cache && php artisan route:cache
```

- **`migrate`** membuat semua tabel dari nol. Migration pertama
  (`2026_06_01_000000_create_base_schema_tables`) berisi tabel inti yang dulu dibuat manual.
- **`db:seed`** mengisi peran login, jenjang kelas, paket bimbingan, profil lembaga, dan akun admin pertama.
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
