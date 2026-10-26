import api from "../../api/axios";

export const getCurriculumsBySubject = async (subjectId) => {
  const response = await api.get(`/admin/curriculums`, { params: { subject_id: subjectId } });
  return response.data.data;
};

export const createCurriculum = async (data) => {
  const response = await api.post(`/admin/curriculums`, data);
  return response.data.data;
};

export const updateCurriculum = async (id, data) => {
  const response = await api.put(`/admin/curriculums/${id}`, data);
  return response.data.data;
};

export const deleteCurriculum = async (id) => {
  const response = await api.delete(`/admin/curriculums/${id}`);
  return response.data;
};

export const toggleCurriculumStatus = async (id) => {
  const response = await api.patch(`/admin/curriculums/${id}/toggle`);
  return response.data;
};