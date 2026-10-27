import api from "@/api/axios";

/* ===================== ADMIN ===================== */

export const getProgressReports = (params = {}) => api.get("/admin/progress-reports", { params });
export const getProgressReportDetail = (params) => api.get("/admin/progress-reports/detail", { params });
export const saveGeneralNote = (data) => api.put("/admin/progress-reports/general-note", data);
export const publishProgressReports = (data) => api.post("/admin/progress-reports/publish", data);
export const unpublishProgressReport = (reportId) => api.post(`/admin/progress-reports/${reportId}/unpublish`);
export const getSemesterReports = (params) => api.get("/admin/progress-reports/semester", { params });
export const getSemesterReportDetail = (params) => api.get("/admin/progress-reports/semester/detail", { params });

/* ===================== TENTOR ===================== */

export const getTentorProgressNotes = (period) => api.get("/tentor/progress-notes", { params: { period } });
export const saveTentorProgressNotes = (data) => api.put("/tentor/progress-notes", data);

/* ===================== ORANG TUA & SISWA (rapor terbit) ===================== */

// role: "parent" | "student"
export const getPublishedReports = (role, params = {}) => api.get(`/${role}/progress-reports`, { params });
export const getPublishedReport = (role, id) => api.get(`/${role}/progress-reports/${id}`);
export const getPublishedSemesters = (role, params) => api.get(`/${role}/progress-reports/semester`, { params });
export const getPublishedSemesterDetail = (role, params) => api.get(`/${role}/progress-reports/semester/detail`, { params });

/* ===================== HELPER ===================== */

export const REPORT_STATUS = {
  DRAFT: { label: "Draft", className: "bg-amber-50 text-amber-700" },
  PUBLISHED: { label: "Terbit", className: "bg-emerald-50 text-emerald-700" },
};

export const TERMS = [
  { value: "GANJIL", label: "Ganjil (Jul–Des)" },
  { value: "GENAP", label: "Genap (Jan–Jun)" },
];

// Tahun ajaran & semester berjalan menurut perangkat
export const currentTerm = () => {
  const now = new Date();
  return now.getMonth() + 1 >= 7
    ? { academic_year: now.getFullYear(), term: "GANJIL" }
    : { academic_year: now.getFullYear() - 1, term: "GENAP" };
};

// Pilihan tahun ajaran: 3 tahun terakhir s/d tahun berjalan
export const academicYearOptions = () => {
  const { academic_year } = currentTerm();
  return [0, 1, 2, 3].map((offset) => academic_year - offset);
};

// Predikat dari nilai rata-rata 0-100
export const scorePredicate = (score) => {
  if (score === null || score === undefined) return null;
  if (score >= 85) return { label: "Sangat Baik", className: "bg-emerald-50 text-emerald-700" };
  if (score >= 75) return { label: "Baik", className: "bg-blue-50 text-blue-700" };
  if (score >= 60) return { label: "Cukup", className: "bg-amber-50 text-amber-700" };
  return { label: "Perlu Bimbingan", className: "bg-rose-50 text-rose-700" };
};

export const formatScore = (value) => (value === null || value === undefined ? "-" : Number(value).toLocaleString("id-ID", { maximumFractionDigits: 1 }));
export const formatPercent = (value) => (value === null || value === undefined ? "-" : `${Number(value).toLocaleString("id-ID", { maximumFractionDigits: 1 })}%`);
