import api from "../api/axios";

export const getLeads = () => api.get("/website/leads");
export const getLead = (id) => api.get(`/website/leads/${id}`);
export const createLead = (data) => api.post("/website/leads", data);
export const updateLead = (id, data) => api.put(`/website/leads/${id}`, data);
export const deleteLead = (id) => api.delete(`/website/leads/${id}`);
export const convertLead = (id) => api.post(`/website/leads/${id}/convert`);