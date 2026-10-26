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
