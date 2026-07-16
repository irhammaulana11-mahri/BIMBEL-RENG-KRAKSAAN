import api from "../api/axios";

export const getParents = ({ page = 1, search = "" } = {}) => api.get("/admin/parents", {params: {page,search,},});
export const getParent = (id) => api.get(`/admin/parents/${id}`);
export const updateParent = (id,data) => api.put(`/admin/parents/${id}`, data);
export const deleteParent = (id) => api.delete(`/admin/parents/${id}`);
export const attachStudent = (id, studentId) =>
  api.post(`/admin/parents/${id}/attach-student`, {
    student_id: studentId,
  });