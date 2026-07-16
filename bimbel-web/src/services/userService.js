import api from "../api/axios";

export const getCompanyProfile = () => api.get("/website/company-profiles");
export const createCompanyProfile = (payload) => api.post("/website/company-profiles", payload);
export const updateCompanyProfile = (id,payload) =>api.put(`/website/company-profiles/${id}`,payload);