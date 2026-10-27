import api from "@/api/axios";

export const getTentorProfile = () => api.get("/tentor/profile");
export const updateTentorProfile = (data) => api.put("/tentor/profile", data);
export const updateTentorPassword = (data) => api.put("/tentor/password", data);
export const getTentorStudents = (params = {}) => api.get("/tentor/students", { params });
