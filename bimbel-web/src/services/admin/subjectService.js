import api from "../../api/axios";

export const getSubjectStatistics = async () => {
    const response = await api.get("/admin/subjects/statistics");
    return response.data;
};

export const getSubjects = async (params = {}) => {
     const query = {
        keyword: params.keyword || "",
        status: params.status || "",
        education_level_id: params.education_level_id || "",
        page: params.page || 1,
        per_page: params.perPage || 10,
    };
    return api.get("/admin/subjects", {params: query});
};

export const getSubject = async (id) => {
    const response = await api.get(`/admin/subjects/${id}`);
    return response.data.data;
};


export const getEducationLevels = async () => {
  const response = await api.get('/admin/education-levels?is_active=1&per_page=100');
  return response.data.data;
};


export const createSubject = (data) => api.post("/admin/subjects", data);
export const updateSubject = (id, data) => api.put(`/admin/subjects/${id}`, data);
export const deleteSubject = (id) => api.delete(`/admin/subjects/${id}`);

export const toggleSubjectStatus = async (id) => {
  const response = await api.patch(`/admin/subjects/${id}/toggle`);
  return response.data; 
};

export const getSubjectSchedules = async (subjectId) => {
  const response = await api.get(`/admin/subjects/${subjectId}/schedules`);
  return response.data.data;
};

// Jadwal, ujian & statistik untuk drawer detail mapel
export const getSubjectOverview = (id) => api.get(`/admin/subjects/${id}/overview`);
