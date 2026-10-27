import api from "@/api/axios";

// Kotak masuk Admin: pindah jadwal (orang tua & tentor) dan pendaftaran anak
export const getRequestSummary = () => api.get("/admin/requests/summary");

export const getRescheduleRequests = (params = {}) => api.get("/admin/reschedule-requests", { params });
export const approveRescheduleRequest = (id, data = {}) => api.patch(`/admin/reschedule-requests/${id}/approve`, data);
export const rejectRescheduleRequest = (id, reviewNote) => api.patch(`/admin/reschedule-requests/${id}/reject`, { review_note: reviewNote });

export const getStudentRegistrations = (params = {}) => api.get("/admin/student-registrations", { params });
export const approveStudentRegistration = (id, data = {}) => api.patch(`/admin/student-registrations/${id}/approve`, data);
export const rejectStudentRegistration = (id, reviewNote) => api.patch(`/admin/student-registrations/${id}/reject`, { review_note: reviewNote });
