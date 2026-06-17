import api from "../api/axios";

export const getPackages = () => api.get("website/packages");
export const createPackage = (data) => api.post("website/packages", data);
export const updatePackage = (id, data) => api.put(`website/packages/${id}`, data);
export const deletePackage = (id) => api.delete(`website/packages/${id}`);