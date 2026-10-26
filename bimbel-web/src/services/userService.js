import api from "../api/axios";

export const getCurrentUser = () => {return api.get("/profile");};
export const getUsers = (params = {}) => {return api.get("/admin/users", { params });};
export const getUserById = (id) => {return api.get(`/admin/users/${id}`);};