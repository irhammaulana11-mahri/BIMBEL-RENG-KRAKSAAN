import api from "@/api/axios";

/* ===================== DASHBOARD & JADWAL ===================== */

export const getParentDashboard = () => api.get("/parent/dashboard");
export const getParentSchedules = (params) => api.get("/parent/schedules", { params });
export const requestParentReschedule = (sessionId, data) => api.post(`/parent/sessions/${sessionId}/reschedule-requests`, data);
export const getParentRescheduleRequests = () => api.get("/parent/reschedule-requests");
export const cancelParentRescheduleRequest = (id) => api.patch(`/parent/reschedule-requests/${id}/cancel`);
export const requestParentLocationChange = (sessionId, data) => api.post(`/parent/sessions/${sessionId}/location-requests`, data);
export const cancelParentLocationRequest = (id) => api.patch(`/parent/location-requests/${id}/cancel`);
export const getParentLocationRequests = () => api.get("/parent/location-requests");

/* ===================== HASIL UJIAN ===================== */

export const getParentExamResults = (params = {}) => api.get("/parent/exam-results", { params });

/* ===================== PROFIL & PENDAFTARAN ANAK ===================== */

export const getParentProfile = () => api.get("/parent/profile");
export const updateParentProfile = (data) => api.put("/parent/profile", data);
export const updateParentPassword = (data) => api.put("/parent/password", data);
export const getRegistrationOptions = () => api.get("/parent/registration-options");
export const getParentRegistrations = () => api.get("/parent/student-registrations");
export const submitParentRegistration = (data) => api.post("/parent/student-registrations", data);
export const cancelParentRegistration = (id) => api.patch(`/parent/student-registrations/${id}/cancel`);

/* ===================== HELPER ===================== */

export const REQUEST_STATUS = {
  PENDING: { label: "Menunggu", className: "bg-amber-50 text-amber-700" },
  APPROVED: { label: "Disetujui", className: "bg-emerald-50 text-emerald-700" },
  REJECTED: { label: "Ditolak", className: "bg-rose-50 text-rose-700" },
  CANCELLED: { label: "Dibatalkan", className: "bg-gray-100 text-gray-500" },
};

export const SESSION_STATUS = {
  SCHEDULED: { label: "Terjadwal", className: "bg-blue-50 text-blue-700" },
  RESCHEDULED: { label: "Dipindah", className: "bg-indigo-50 text-indigo-700" },
  IN_PROGRESS: { label: "Berlangsung", className: "bg-amber-50 text-amber-700" },
  COMPLETED: { label: "Selesai", className: "bg-emerald-50 text-emerald-700" },
  CANCELLED: { label: "Dibatalkan", className: "bg-rose-50 text-rose-700" },
};

export const ATTENDANCE_LABEL = {
  HADIR: { label: "Hadir", className: "bg-emerald-50 text-emerald-700" },
  IZIN: { label: "Izin", className: "bg-blue-50 text-blue-700" },
  SAKIT: { label: "Sakit", className: "bg-amber-50 text-amber-700" },
  ALPA: { label: "Alpa", className: "bg-rose-50 text-rose-700" },
};

// "2026-10-27" -> "Selasa, 27 Okt 2026"
export const formatSessionDate = (date, options = { weekday: "long", day: "numeric", month: "short", year: "numeric" }) =>
  date ? new Date(`${date}T00:00:00`).toLocaleDateString("id-ID", options) : "-";

// Tanggal lokal (YYYY-MM-DD) + offset hari
export const dateOffset = (days, base = new Date()) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
