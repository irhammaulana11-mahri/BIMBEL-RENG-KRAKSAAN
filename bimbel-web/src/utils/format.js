// Format angka ke Rupiah tanpa desimal, contoh: Rp 310.800
export const formatRupiah = (value) =>
  "Rp " + Math.round(Number(value) || 0).toLocaleString("id-ID");

// "2026-10" -> "Oktober 2026"
export const formatPeriod = (period) => {
  if (!period) return "-";
  const [year, month] = period.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("id-ID", { month: "long", year: "numeric" });
};

// Periode bulan berjalan (YYYY-MM) menurut waktu perangkat
export const currentPeriod = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

// Tanggal hari ini (YYYY-MM-DD) menurut waktu perangkat, untuk default input date
export const todayDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};
