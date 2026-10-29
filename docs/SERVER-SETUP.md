# Panduan Penyiapan Server Lokal & Cloudflare Tunnel — Bimbel Reng Kraksaan

Panduan langkah demi langkah memasang aplikasi di **komputer/server lokal** (di kantor/rumah) dan membukanya ke
internet lewat **Cloudflare Tunnel**, **tanpa membuka port di router** dan tanpa IP publik statis.
Ringkasan konfigurasi aplikasi ada di [DEPLOY.md](../DEPLOY.md); panduan ini adalah urutan pengerjaannya.

## Cara kerjanya

```
Pengunjung ──HTTPS──▶ Cloudflare ◀══ terowongan keluar (cloudflared) ══ Server lokal
                                                                     └▶ Nginx 127.0.0.1:80 ─▶ web / API
```

- Program `cloudflared` di server **membuka koneksi keluar** ke Cloudflare. Router tidak perlu port forwarding,
  dan tetap berjalan walau ISP memakai CGNAT atau IP berubah-ubah.
- Server **tidak bisa diakses langsung dari internet**; semua lalu lintas lewat Cloudflare.
- HTTPS dan sertifikat diurus Cloudflare (tidak perlu Origin Certificate / Let's Encrypt).

**Asumsi:** server **Ubuntu Server 24.04** (PC/mini PC khusus, minimal 4 GB RAM, SSD), tersambung ke router
lewat kabel LAN, domain `bolinggo.org` sudah di Cloudflare.

| Alamat | Isi |
|---|---|
| `https://bimbel.bolinggo.org` | Web (portal & landing page) |
| `https://api-bimbel.bolinggo.org` | API Laravel (dipakai web & aplikasi Android) |

Keduanya subdomain **satu tingkat** di bawah `bolinggo.org`, sehingga tercakup sertifikat HTTPS gratis Cloudflare.
Record lain milik `bolinggo.org` (situs/email lain) **tidak diubah** oleh panduan ini.

**Ganti contoh di bawah dengan milik Anda:**

| Contoh di panduan | Ganti dengan |
|---|---|
| `192.168.1.50` | IP LAN server (lihat B1) |
| `192.168.1.0/24` | Jaringan LAN Anda |
| `PASSWORD_DB_KUAT` | Password database (acak, ≥ 20 karakter) |

Perkiraan waktu: 1–2 jam. Kerjakan berurutan; setiap bagian diakhiri **cek** sebelum lanjut.

---

## Bagian A — Hal yang perlu disiapkan di lokasi server

Server lokal bergantung pada listrik & internet setempat. Siapkan:

- **UPS** untuk server dan router (pemadaman singkat tidak mematikan aplikasi / merusak database).
- **BIOS:** aktifkan *Restore on AC Power Loss → Power On*, agar server menyala sendiri setelah listrik kembali.
- **Koneksi kabel** (bukan Wi-Fi) ke router.
- **Cadangan di luar server** (flashdisk/hard disk eksternal/cloud), karena kerusakan disk atau pencurian
  menghilangkan server sekaligus backup di dalamnya (lihat bagian E).

---

## Bagian B — Persiapan server

### B1. IP LAN tetap

Masuk ke halaman admin router → **DHCP reservation / Static lease** → kunci IP server, mis. `192.168.1.50`.
Ini hanya untuk SSH dari jaringan kantor; **jangan** membuat port forwarding.

### B2. Pengguna admin & pembaruan

Dari komputer lain di jaringan yang sama: `ssh nama-user@192.168.1.50`

```bash
sudo apt update && sudo apt upgrade -y
sudo timedatectl set-timezone Asia/Jakarta
```

Salin kunci SSH Anda (dari komputer Anda: `ssh-copy-id nama-user@192.168.1.50`), pastikan bisa masuk tanpa
password, lalu matikan login root & password:

```bash
sudo sed -i 's/^#\?PermitRootLogin.*/PermitRootLogin no/; s/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
sudo systemctl restart ssh
```

> Uji login di jendela terminal **baru** sebelum menutup sesi lama.

### B3. Paket yang dibutuhkan

```bash
sudo apt install -y nginx git unzip curl ufw \
  php8.3-fpm php8.3-cli php8.3-pgsql php8.3-mbstring php8.3-xml php8.3-curl \
  php8.3-zip php8.3-gd php8.3-bcmath php8.3-intl \
  postgresql-16 postgresql-client-16

# Composer
curl -sS https://getcomposer.org/installer | sudo php -- --install-dir=/usr/local/bin --filename=composer

# Node.js 22 (untuk build web)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
```

**Cek:** `php -v` (8.3), `psql --version` (**≥ 16.10**, syarat restore backup), `node -v` (22), `composer -V`.
Bila `psql` < 16.10: `sudo apt upgrade postgresql-client-16`.

### B4. Firewall

Tunnel hanya memakai koneksi **keluar**, jadi semua koneksi masuk ditutup kecuali SSH dari LAN:

```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow from 192.168.1.0/24 to any port 22 proto tcp
sudo ufw enable
sudo ufw status
```

---

## Bagian C — Aplikasi

### C1. Database

```bash
sudo -u postgres psql <<'SQL'
CREATE USER bimbel_user WITH PASSWORD 'PASSWORD_DB_KUAT';
CREATE DATABASE bimbel_kraksaan_db OWNER bimbel_user;
\c bimbel_kraksaan_db
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
SQL
```

> **Tentang DB-01 (akun database terpisah):** aplikasi memakai satu akun pemilik database. Ini disengaja:
> fitur **Pulihkan dari backup** menghapus dan membuat ulang schema, sehingga butuh akun pemilik. Memisahkan akun
> aplikasi (hanya baca/tulis data) akan membuat restore dari menu Backup berhenti bekerja. Pemisahan akun perlu
> perubahan kode tersendiri — jangan dipisah manual.

**Cek:** `psql -h 127.0.0.1 -U bimbel_user -d bimbel_kraksaan_db -c 'select 1'` berhasil.

### C2. Ambil kode

```bash
sudo mkdir -p /var/www/bimbel && sudo chown $USER:$USER /var/www/bimbel
cd /var/www/bimbel
```

Repository GitHub privat → pakai **deploy key** (kunci khusus server, hanya baca):

```bash
ssh-keygen -t ed25519 -C "server-bimbel" -f ~/.ssh/github_deploy -N ""
cat ~/.ssh/github_deploy.pub
```

Tempel isi kunci publik di GitHub → repository → **Settings → Deploy keys → Add deploy key** (jangan centang
*write access*). Lalu:

```bash
printf "Host github.com\n  IdentityFile ~/.ssh/github_deploy\n" >> ~/.ssh/config
git clone git@github.com:irhammaulana11-mahri/BIMBEL-RENG-KRAKSAAN.git .
```

### C3. Backend (`bimbel-api`)

```bash
cd /var/www/bimbel/bimbel-api
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate
nano .env
```

Isi `.env` (selain yang sudah ada):

```dotenv
APP_ENV=production
APP_DEBUG=false
# Wajib https: alamat berkas upload (logo, banner) dibentuk dari nilai ini
APP_URL=https://api-bimbel.bolinggo.org

DB_HOST=127.0.0.1
DB_DATABASE=bimbel_kraksaan_db
DB_USERNAME=bimbel_user
DB_PASSWORD=PASSWORD_DB_KUAT

CORS_ALLOWED_ORIGINS=https://bimbel.bolinggo.org
SANCTUM_EXPIRATION=720
FINANCE_APPROVAL_MODE=single_operator

# Akun pertama (dibuat sebagai Super Admin). Kosongkan password agar dibuatkan acak & ditampilkan sekali.
SEED_ADMIN_EMAIL=email-anda@contoh.id
SEED_ADMIN_PASSWORD=
SEED_ADMIN_NAME=Nama Anda

# Rekomendasi rapor AI (opsional)
ANTHROPIC_API_KEY=
```

Lalu:

```bash
php artisan migrate --force
php artisan db:seed --force          # catat password sementara bila ditampilkan
php artisan storage:link
php artisan config:cache && php artisan route:cache

sudo chown -R $USER:www-data storage bootstrap/cache
sudo chmod -R ug+rwX storage bootstrap/cache
```

> Bila Anda mengisi `SEED_ADMIN_PASSWORD`, kosongkan lagi setelah seeding lalu `php artisan config:cache`.

### C4. Frontend (`bimbel-web`)

```bash
cd /var/www/bimbel/bimbel-web
echo "VITE_API_URL=https://api-bimbel.bolinggo.org" > .env
npm ci && npm run build
```

### C5. PHP-FPM

```bash
sudo sed -i 's/^upload_max_filesize.*/upload_max_filesize = 100M/; s/^post_max_size.*/post_max_size = 100M/; s/^memory_limit.*/memory_limit = 512M/' /etc/php/8.3/fpm/php.ini
# Backup & pemulihan berjalan setelah respons dikirim: jangan diputus terlalu cepat
echo "request_terminate_timeout = 1800" | sudo tee -a /etc/php/8.3/fpm/pool.d/www.conf
sudo systemctl restart php8.3-fpm
```

> Batas 100 MB mengikuti batas unggah Cloudflare paket gratis. Backup lebih besar dipulihkan langsung di server:
> `php artisan backup:restore /path/berkas.zip`.

### C6. Nginx (hanya untuk tunnel, tidak terbuka ke jaringan)

**IP asli pengguna** — semua koneksi datang dari `cloudflared` di server sendiri (127.0.0.1); IP pengunjung
asli dikirim Cloudflare di header `CF-Connecting-IP`. Wajib agar batas 5 gagal login berlaku **per pengguna**:

```bash
printf "set_real_ip_from 127.0.0.1;\nset_real_ip_from ::1;\nreal_ip_header CF-Connecting-IP;\n" \
  | sudo tee /etc/nginx/conf.d/cloudflare-realip.conf
```

**Situs** — buat `/etc/nginx/sites-available/bimbel`:

```nginx
# Web (React)
server {
    listen 127.0.0.1:80;
    server_name bimbel.bolinggo.org;

    root /var/www/bimbel/bimbel-web/dist;
    index index.html;

    location / {
        try_files $uri /index.html;
    }
    location /assets/ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }
}

# API (Laravel)
server {
    listen 127.0.0.1:80;
    server_name api-bimbel.bolinggo.org;

    root /var/www/bimbel/bimbel-api/public;
    index index.php;
    client_max_body_size 100M;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.3-fpm.sock;
        fastcgi_read_timeout 300;
        # Pengunjung terhubung lewat HTTPS ke Cloudflare; beri tahu Laravel walau tunnel → Nginx memakai HTTP lokal
        fastcgi_param HTTPS on;
    }
    location ~ /\.(?!well-known) {
        deny all;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/bimbel /etc/nginx/sites-enabled/bimbel
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx
```

**Cek:** `curl -s -H "Host: api-bimbel.bolinggo.org" http://127.0.0.1/up | head -3` menampilkan HTML (aplikasi hidup),
dan `sudo ss -tlnp | grep ':80'` hanya menampilkan `127.0.0.1:80`.

### C7. Penjadwal (backup otomatis & pembersihan token)

```bash
sudo crontab -u www-data -e
```

Tambahkan baris:

```cron
* * * * * cd /var/www/bimbel/bimbel-api && php artisan schedule:run >> /dev/null 2>&1
```

> Aplikasi tidak memakai antrean (queue), jadi tidak perlu queue worker.

---

## Bagian D — Cloudflare Tunnel & subdomain

### D1. Periksa record lama

Cloudflare → `bolinggo.org` → **DNS → Records**: bila sudah ada record bernama **`bimbel`** atau
**`api-bimbel`**, hapus hanya kedua record itu; tunnel akan membuatnya sendiri (langkah D3).

> **Jangan** menghapus atau mengubah record lain (`@`, `www`, `MX`, dan sebagainya): itu milik situs/email lain
> di `bolinggo.org`.

### D2. Buat tunnel

1. Cloudflare dashboard → **Zero Trust** (bila diminta memilih paket, pilih **Free**).
2. **Networks → Tunnels → Create a tunnel** → tipe **Cloudflared** → nama: `bimbel-server` → Save.
3. Pilih sistem operasi **Debian/Ubuntu (64-bit)**. Dashboard menampilkan perintah pemasangan yang memuat
   **token**. Jalankan perintah itu di server; bentuknya seperti:

   ```bash
   # (salin persis dari dashboard — token bersifat rahasia, jangan dibagikan)
   curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared.deb
   sudo cloudflared service install <TOKEN-DARI-DASHBOARD>
   ```

4. Tunggu status konektor di dashboard menjadi **Connected / Healthy** → Next.

**Cek di server:** `systemctl status cloudflared` → `active (running)`, dan otomatis menyala saat boot.
Pastikan tunnel dijalankan **oleh layanan sistem** ini, bukan perintah `cloudflared tunnel run --token ...`
yang diketik manual di terminal (proses manual hilang saat server restart):
`pgrep -a cloudflared` harus menampilkan **satu** proses saja.

> **Jaringan kantor yang memblokir UDP** (log: `Failed to dial a quic connection ... timeout`, layanan gagal
> menyala karena *timeout*): paksa protokol HTTP/2 lewat TCP 443, lalu muat ulang layanan.
>
> ```bash
> sudo mkdir -p /etc/systemd/system/cloudflared.service.d
> printf '[Service]\nEnvironment=TUNNEL_TRANSPORT_PROTOCOL=http2\n' | sudo tee /etc/systemd/system/cloudflared.service.d/protocol.conf
> sudo systemctl daemon-reload && sudo systemctl restart cloudflared
> sudo journalctl -u cloudflared -n 15 --no-pager | grep Registered   # 4 baris ... protocol=http2
> ```
>
> **Layanan memakai `--token-file /etc/cloudflared/token`** (log: `requires the ID or name of the tunnel`):
> berkas token kosong atau hilang. Isi ulang tanpa menampilkan token, lalu `sudo chmod 600 /etc/cloudflared/token`
> dan restart layanan. Cek dengan `sudo wc -c /etc/cloudflared/token` (harus > 100 byte, diawali `eyJ`).

### D3. Hubungkan subdomain

Di halaman tunnel → **Public Hostname → Add a public hostname**, buat dua entri:

| Subdomain | Domain | Path | Service type | URL |
|---|---|---|---|---|
| `bimbel` | `bolinggo.org` | | HTTP | `127.0.0.1:80` |
| `api-bimbel` | `bolinggo.org` | | HTTP | `127.0.0.1:80` |

> Tulis **`127.0.0.1:80`**, bukan `localhost:80`: `localhost` bisa diterjemahkan ke IPv6 (`::1`), sedangkan
> Nginx hanya mendengar IPv4 `127.0.0.1`, sehingga pengunjung mendapat **error 502**.

Cloudflare otomatis membuat record DNS `CNAME` (status *Proxied*) untuk keduanya. Nginx memilih web atau API
berdasarkan nama domain yang diminta.

### D4. Pengaturan SSL domain

Cloudflare → domain → **SSL/TLS**:
- **Overview → Full** (tunnel sudah terenkripsi; tidak perlu sertifikat di server).
  Pengaturan SSL berlaku untuk seluruh `bolinggo.org`: bila situs lain di domain ini memakai server dengan
  sertifikat sendiri, mode **Full** tetap aman; jangan menurunkannya ke *Flexible*.
- **Edge Certificates → Always Use HTTPS: On**, **Minimum TLS Version: 1.2**, **Automatic HTTPS Rewrites: On**.

**Cek:** dari HP dengan data seluler (bukan Wi-Fi kantor), buka `https://api-bimbel.bolinggo.org/up` →
halaman "Application up".

---

## Bagian E — Pengecekan akhir

| # | Cek | Hasil yang diharapkan |
|---|---|---|
| 1 | Buka `https://api-bimbel.bolinggo.org/up` | Halaman "Application up" |
| 2 | Buka `https://bimbel.bolinggo.org` | Landing page dengan logo; gembok HTTPS |
| 3 | Login dengan akun dari C3 | Masuk ke dashboard admin |
| 4 | Menu **Pengaturan → Backup & Pemulihan** | Tidak ada peringatan "penjadwal belum berjalan" (tunggu 1–2 menit) |
| 5 | **Buat backup sekarang** lalu **Verifikasi** | 6 pemeriksaan lulus, termasuk "Program pemulih aman" |
| 6 | Atur jadwal backup harian, **retensi minimal 7** | Tersimpan |
| 7 | Salah password 6× dari satu HP | Percobaan ke-6 ditolak "Terlalu banyak percobaan"; perangkat lain tetap bisa login (bukti IP asli terbaca) |
| 8 | Unduh PDF invoice dari web | Nama berkas `Invoice-INV-....pdf` (bukan "dokumen.pdf") |
| 9 | Matikan lalu nyalakan server | Web kembali bisa dibuka tanpa tindakan apa pun (nginx, php-fpm, postgresql, cloudflared menyala otomatis) |

Setelah semua lulus, lanjutkan ke **APK rilis Android** (DEPLOY.md bagian 6) dengan
`--dart-define=API_URL=https://api-bimbel.bolinggo.org`.

---

## Bagian F — Perawatan rutin

**Cadangan di luar server** (paling penting untuk server lokal):
- Unduh backup terbaru lewat menu Backup → **Unduh**, simpan di laptop/flashdisk/cloud **minimal seminggu sekali**.
- Atau salin otomatis ke disk eksternal yang terpasang, mis. setiap malam:

  ```cron
  # crontab pengguna admin (crontab -e): salin arsip backup ke disk eksternal pukul 23.30
  30 23 * * * rsync -a /var/www/bimbel/bimbel-api/storage/app/backups/ /media/backup-eksternal/bimbel/
  ```

**Memperbarui aplikasi** (setelah ada commit baru di `main`):

```bash
cd /var/www/bimbel && git pull
cd bimbel-api && composer install --no-dev --optimize-autoloader
php artisan backup:run                      # backup dulu sebelum migration
php artisan migrate --force
php artisan config:cache && php artisan route:cache
cd ../bimbel-web && npm ci && npm run build
sudo systemctl reload php8.3-fpm
```

**Rutin bulanan:** `sudo apt update && sudo apt upgrade` (termasuk `postgresql-client-16` dan `cloudflared`),
cek `storage/logs/laravel.log`, cek sisa ruang disk (`df -h`).

**Bila terjadi masalah:**

| Gejala | Kemungkinan penyebab |
|---|---|
| Error 1033 / "Argo Tunnel error" | `cloudflared` mati atau internet server putus: `sudo systemctl restart cloudflared` |
| Web bisa dibuka tetapi semua login gagal "password salah" | API tidak terjangkau: cek `curl -s -o /dev/null -w "%{http_code}" https://api-bimbel.bolinggo.org/up` (harus 200) dan rute `api-bimbel` di tunnel (D3) |
| `Could not resolve host: api-bimbel...` | Rute `api-bimbel` belum ditambahkan di tunnel; setelah ditambah: `sudo resolvectl flush-caches` |
| Error 502 | URL rute tunnel `localhost:80` (ganti `127.0.0.1:80`, lihat D3), atau Nginx/PHP-FPM mati: `sudo systemctl status nginx php8.5-fpm` |
| Web tampil, tetapi data gagal dimuat | `VITE_API_URL` salah saat build (C4) atau `CORS_ALLOWED_ORIGINS` tidak memuat domain web |
| Gambar/logo tidak muncul, atau peringatan "mixed content" | `APP_URL` belum `https://...` (C3); jalankan ulang `php artisan config:cache` |
| Error 500 di API | `storage/logs/laravel.log`; izin folder `storage` (C3) |
| Unggah backup gagal | Berkas > 100 MB (batas Cloudflare); pulihkan lewat terminal |
| Semua pengguna terkunci login bersamaan | IP asli belum terbaca (C6) |
| Aplikasi tidak bisa dibuka saat listrik/internet kantor padam | Sifat server lokal; UPS & modem cadangan mengurangi risikonya |
