import api from "../../api/axios";

export const getTentorSummary = async () => {
  const response = await api.get("/admin/tentors/summary");
  return response.data.data;
};

export const getTentors = async (params = {}) => {
  const query = {
    keyword: params.keyword || "",
    status: params.status || "",
    specialization: params.specialization || "",
    page: params.page || 1,
    per_page: params.perPage || 10,
  };
  return api.get("/admin/tentors", { params: query });
};

export const getTentor = async (id) => {
  const response = await api.get(`/admin/tentors/${id}`);
  return response.data;
};

export const createTentor = (payload) => {
  return api.post("/admin/tentors", payload);
};

export const updateTentor = (id, data) => {
  return api.put(`/admin/tentors/${id}`, data);
};

export const toggleTentorStatus = (id) => {
  return api.patch(`/admin/tentors/${id}/toggle`);
};

export const deleteTentor = (id) => {
  return api.delete(`/admin/tentors/${id}`);
};

export const syncTentorSubjects = (id, subjectIds) => {
  return api.post(`/admin/tentors/${id}/assign`, {
    subject_ids: subjectIds,
  });
};