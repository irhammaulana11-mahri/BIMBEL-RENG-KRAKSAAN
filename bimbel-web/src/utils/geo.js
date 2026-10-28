// Ambil posisi GPS perangkat. Melempar Error berpesan ramah bila gagal.
// Catatan: browser hanya mengizinkan geolokasi di HTTPS (atau localhost).
export const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Browser ini tidak mendukung GPS."));
      return;
    }
    if (!window.isSecureContext) {
      reject(new Error("GPS hanya dapat dipakai lewat koneksi HTTPS."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, accuracy: pos.coords.accuracy }),
      (err) => {
        const messages = {
          1: "Izin lokasi ditolak. Izinkan akses lokasi untuk situs ini di pengaturan browser.",
          2: "Posisi tidak dapat ditentukan. Pastikan GPS / layanan lokasi aktif.",
          3: "Waktu mengambil lokasi habis. Coba lagi di tempat terbuka.",
        };
        reject(new Error(messages[err.code] || "Gagal mengambil lokasi GPS."));
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
    );
  });

// Jarak dua titik (meter), rumus haversine - sama dengan perhitungan server
export const distanceMeter = (lat1, lng1, lat2, lng2) => {
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 6371000 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const mapsLink = (lat, lng) => `https://www.google.com/maps?q=${lat},${lng}`;
