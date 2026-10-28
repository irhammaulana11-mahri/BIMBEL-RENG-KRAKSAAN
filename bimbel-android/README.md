# Bimbel Reng Kraksaan — Aplikasi Android (Flutter)

Aplikasi mobile untuk **Siswa**, **Orang Tua**, **Tentor**, dan **Admin** (versi ringan, tugas harian saja).
Aplikasi ini memakai API yang sama dengan versi web (`bimbel-api`).

## Menjalankan

```bash
flutter pub get

# Emulator Android (10.0.2.2 = localhost komputer)
flutter run

# HP fisik di jaringan yang sama: pakai IP komputer, dan jalankan API dengan --host=0.0.0.0
php artisan serve --host=0.0.0.0 --port=8001      # di folder bimbel-api
flutter run --dart-define=API_URL=http://192.168.1.10:8001

# Build APK rilis untuk server produksi
flutter build apk --release --dart-define=API_URL=https://api.domain-anda.com
```

`android/gradle.properties` mengarahkan Gradle ke JDK 17 (`org.gradle.java.home`), karena Gradle 8.14
belum mendukung Java 25 bawaan Android Studio. Sesuaikan path itu jika JDK 17 ada di lokasi lain.

## Fitur

| Portal | Fitur |
|---|---|
| Siswa | Beranda, jadwal mingguan & detail sesi, ujian online (timer, simpan otomatis, kumpulkan, hasil & pembahasan), materi (buka berkas/video/link), profil, rapor, ganti password |
| Orang Tua | Beranda, jadwal anak & pengajuan pindah jadwal, tagihan & kirim bukti transfer, hasil ujian, profil anak, rapor, ganti password |
| Tentor | Beranda, jadwal (hari/minggu/bulan), ruang kerja sesi (mulai/akhiri sesi, jalankan aktivitas, absensi siswa), penilaian essay, honor, profil, ganti password |
| Admin / Super Admin | Beranda (statistik, keuangan bulan ini, pekerjaan tertunda, sesi hari ini + absensi siswa), verifikasi bukti transfer (terima/tolak), catat pembayaran tunai/transfer per tagihan, setujui/tolak pindah jadwal & pendaftaran anak |

Belum tersedia di aplikasi (pakai versi web): menambah/mengurutkan aktivitas sesi, catatan perkembangan rapor (tentor),
pendaftaran anak baru, dan edit profil orang tua.
Admin: data master, kelas & jadwal, ujian, rapor, honor, pengeluaran, users, CMS website, mengubah jam/tentor saat
menyetujui pindah jadwal, dan menempatkan siswa baru ke kelas tetap lewat web.

## Struktur

```
lib/
  config.dart            alamat API (--dart-define=API_URL)
  api/api_client.dart    HTTP + token Bearer (disimpan di secure storage)
  auth/auth_state.dart   login, profil, logout
  widgets/               komponen bersama (kartu sesi, status, AsyncView, dll.)
  screens/student|parent|tentor|admin/
```
