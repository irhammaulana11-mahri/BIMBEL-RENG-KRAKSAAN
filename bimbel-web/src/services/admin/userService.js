import api from "@/api/axios";

// Manajemen akun login (Admin)
export const getUsers = (params = {}) => api.get("/admin/users", { params });
export const getUserById = (id) => api.get(`/admin/users/${id}`);
export const getUserOptions = () => api.get("/admin/users/options");
export const createUser = (data) => api.post("/admin/users", data);
export const updateUser = (id, data) => api.put(`/admin/users/${id}`, data);
export const toggleUserStatus = (id) => api.patch(`/admin/users/${id}/toggle`);
export const resetUserPassword = (id) => api.patch(`/admin/users/${id}/reset-password`);
export const deleteUser = (id) => api.delete(`/admin/users/${id}`);

export const ROLE_BADGE = {
  super_admin: "bg-rose-50 text-rose-700",
  admin: "bg-blue-50 text-blue-700",
  tentor: "bg-indigo-50 text-indigo-700",
  orang_tua: "bg-purple-50 text-purple-700",
  siswa: "bg-emerald-50 text-emerald-700",
};

// Ganti password akun admin/super admin yang sedang login
export const updateAdminPassword = (data) => api.put("/admin/password", data);
