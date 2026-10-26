// Filter bawaan untuk pencarian & tabel
export const DEFAULT_SCHEDULE_FILTER = {
  keyword: "",
  day_of_week: "",
  class_type: "",
};

// Map konversi angka dari/ke backend (0 = Minggu, 1 = Senin, dst.)
export const DAY_MAP = {
  0: "Minggu",
  1: "Senin",
  2: "Selasa",
  3: "Rabu",
  4: "Kamis",
  5: "Jumat",
  6: "Sabtu",
};

export const DAY_TO_INT_MAP = {
  Minggu: 0,
  Senin: 1,
  Selasa: 2,
  Rabu: 3,
  Kamis: 4,
  Jumat: 5,
  Sabtu: 6,
};

// Daftar Hari (Senin - Minggu) untuk Kalender / Dropdown
export const DAYS_LIST = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
  "Minggu",
];

// Slot Waktu Standar KBM
export const STANDARD_TIME_SLOTS = [
  { label: "08:00 - 10:00", start: "08:00", end: "10:00" },
  { label: "10:00 - 12:00", start: "10:00", end: "12:00" },
  { label: "13:00 - 15:00", start: "13:00", end: "15:00" },
  { label: "15:00 - 17:00", start: "15:00", end: "17:00" },
  { label: "17:00 - 19:00", start: "17:00", end: "19:00" },
  { label: "19:00 - 21:00", start: "19:00", end: "21:00" },
];