import api from "@/api/axios";

export const getTentorSchedules = (params) => {
    return api.get(`/tentor/schedules`, { params });
};

// Mulai sesi + absen masuk GPS. position: { latitude, longitude, accuracy } (kosong untuk kelas online)
export const startTentorSession = (sessionId, position = {}) => {
    return api.post(`/tentor/sessions/${sessionId}/start`, { ...position, source: "WEB" });
};

export const requestReschedule = (sessionId, data) => {
    return api.post(`/tentor/sessions/${sessionId}/reschedule-request`, data);
};

export const getSessionWorkspace = (sessionId) => {
    return api.get(`/tentor/sessions/${sessionId}/workspace`);
};

// Mengambil data Curriculum, Material, dan Exam berdasarkan mata pelajaran sesi
export const getSessionReferenceData = (sessionId) => {
  return api.get(`/tentor/sessions/${sessionId}/reference-data`);
};

// Menyimpan aktivitas baru ke sesi
export const addSessionActivity = (sessionId, data) => {
  return api.post(`/tentor/sessions/${sessionId}/activities`, data);
};
// Menyimpan absensi siswa dari Session Workspace
export const saveSessionAttendance = (sessionId, data) => {
  return api.post(`/tentor/sessions/${sessionId}/attendance`, data);
};

// Menyelesaikan sesi KBM (sekaligus check-out tentor)
export const endTentorSession = (sessionId, position = {}) => {
  return api.post(`/tentor/sessions/${sessionId}/end`, { ...position, source: "WEB" });
};

// Pengajuan lokasi les sementara (disetujui Admin)
export const requestLocationChange = (sessionId, data) => api.post(`/tentor/sessions/${sessionId}/location-request`, data);
export const cancelTentorLocationRequest = (id) => api.patch(`/tentor/location-requests/${id}/cancel`);
export const getTentorLocationRequests = () => api.get("/tentor/location-requests");

// Riwayat kehadiran tentor per bulan (format YYYY-MM)
export const getMyAttendances = (params) => {
  return api.get(`/tentor/attendances`, { params });
};

// Aksi aktivitas sesi: start | complete | cancel
export const changeSessionActivityStatus = (sessionId, activityId, action) => {
  return api.patch(`/tentor/sessions/${sessionId}/activities/${activityId}/${action}`);
};

export const deleteSessionActivity = (sessionId, activityId) => {
  return api.delete(`/tentor/sessions/${sessionId}/activities/${activityId}`);
};

export const reorderSessionActivities = (sessionId, activityIds) => {
  return api.put(`/tentor/sessions/${sessionId}/activities/reorder`, { activity_ids: activityIds });
};

export const getTentorRescheduleRequests = () => api.get("/tentor/reschedule-requests");
export const cancelTentorRescheduleRequest = (id) => api.patch(`/tentor/reschedule-requests/${id}/cancel`);

// Pengajuan koreksi absensi siswa pada sesi yang sudah selesai (disetujui Admin)
export const requestAttendanceCorrection = (sessionId, data) => api.post(`/tentor/sessions/${sessionId}/attendance-corrections`, data);
export const getMyAttendanceCorrections = (sessionId) => api.get("/tentor/attendance-corrections", { params: { session_id: sessionId } });
