import api from "@/api/axios";

export const getStudentAttendanceForm = (sessionId) => {
    return api.get(`/admin/attendances/sessions/${sessionId}/students`);
};

export const saveStudentAttendance = (sessionId, data) => {
    return api.post(`/admin/attendances/sessions/${sessionId}/students`, data);
};

// 🟢 Ambil data Log Tentor & Ringkasan Sesi (dengan parameter filter)
export const getTentorAttendances = (params) => {
    return api.get(`/admin/attendances/tentors`, { params });
};

// Koreksi / input manual absensi tentor pada sesi
export const saveTentorAttendance = (sessionId, data) => {
    return api.put(`/admin/attendances/sessions/${sessionId}/tentor`, data);
};

// Ambil data absensi siswa (Sesi List)
export const getStudentSessions = (params) => {
    return api.get(`/admin/attendances/students`, { params });
};

// Koreksi absensi yang terkunci tagihan/payroll
export const requestAttendanceCorrection = (sessionId, data) => api.post(`/admin/attendances/sessions/${sessionId}/corrections`, data);
export const getAttendanceCorrections = (params = {}) => api.get("/admin/attendances/corrections", { params });
// data: FormData (bukti refund opsional)
export const approveAttendanceCorrection = (id, data) => api.post(`/admin/attendances/corrections/${id}/approve`, data, { headers: { "Content-Type": "multipart/form-data" } });
export const rejectAttendanceCorrection = (id, note) => api.patch(`/admin/attendances/corrections/${id}/reject`, { note });
