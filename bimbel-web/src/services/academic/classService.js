import api from "../../api/axios";

export const getClassSummary = async () => {
  const response = await api.get("/admin/classes/summary");
  return response.data.data;
};

export const getClasses = async (params = {}) => {
  const query = {
    keyword: params.keyword || "",
    status_active: params.status_active || "",
    status: params.status || "",
    class_type: params.class_type || "",
    education_level: params.education_level || "",
    page: params.page || 1,
    per_page: params.perPage || 10,
  };
  return api.get("/admin/classes", { params: query });
};

export const getClass = async (id) => {
  const response = await api.get(`/admin/classes/${id}`);
  return response.data;
};

export const createClass = (payload) => {
  return api.post("/admin/classes", payload);
};

export const updateClass = (id, data) => {
  return api.put(`/admin/classes/${id}`, data);
};

export const toggleClassStatus = (id) => {
  return api.patch(`/admin/classes/${id}/toggle-status`);
};

export const updateClassProgressStatus = (id, status) => {
  return api.patch(`/admin/classes/${id}/progress-status`, { status });
};

export const duplicateClass = (id) => {
  return api.post(`/admin/classes/${id}/duplicate`);
};

export const deleteClass = (id) => {
  return api.delete(`/admin/classes/${id}`);
};

export const syncClassStudents = (classId, studentIds) => {
  return api.put(`/admin/classes/${classId}/students`, {
    student_ids: studentIds,
  });
};

export const updateClassSubjects = (classId, subjects) => {
  return api.put(`/admin/classes/${classId}/subjects`, {
    subjects: subjects,
  });
};

export const updateClassTentors = (classId, assignments) => {
  return api.put(`/admin/classes/${classId}/tentors`, {
    assignments: assignments,
  });
};

export const getSubjectsForClass = async (params = {}) => {
  const response = await api.get("/admin/classes/available-subjects", { params });
  return response.data; 
};

export const getTentorsForClass = async (params = {}) => {
  const query = new URLSearchParams();
  
  if (params.education_level) query.append("education_level", params.education_level);
  if (params.education_level_id) query.append("education_level_id", params.education_level_id);
  
  if (Array.isArray(params.subject_ids)) {
    params.subject_ids.forEach((id) => query.append("subject_ids[]", id));
  }

  const response = await api.get("/admin/classes/available-tentors", { params: query });
  return response.data;
};

export const getStudentsForClass = async (params = {}) => {
  const response = await api.get("/admin/classes/available-students", { params });
  return response.data;
};

export const getUnscheduledClasses = (params) => {
  return api.get("/admin/classes/unscheduled", { params });
};
// Peserta kelas: [{ id, student: { id, nis, name, ... } }]
export const getClassStudents = (classId) => api.get(`/admin/classes/${classId}/students`);

// Data drawer detail kelas (lokasi sesuai jenis, progres mapel, siswa, jadwal, kehadiran)
export const getClassOverview = (id) => api.get(`/admin/classes/${id}/overview`);
