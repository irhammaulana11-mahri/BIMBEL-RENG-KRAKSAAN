import api from "../../api/axios";

// 🟢 Method Baru: Ambil Ringkasan Statistik
export const getLocationSummary = async () => {
  const response = await api.get("/admin/locations/summary");
  return response.data.data;
};

export const getLocations = async (params = {}) => {
  const query = {
    keyword: params.keyword || "",
    status: params.status || "",
    page: params.page || 1,
    per_page: params.perPage || 10,
  };
  return await api.get("/admin/locations", { params: query });
};

export const getLocation = async (id) => {
  const response = await api.get(`/admin/locations/${id}`);
  return response.data;
};

export const createLocation = async (data) => {
  return await api.post("/admin/locations", data);
};

export const updateLocation = async (id, data) => {
  return await api.put(`/admin/locations/${id}`, data);
};

export const toggleLocationStatus = async (id) => {
  return await api.patch(`/admin/locations/${id}/toggle`);
};

export const deleteLocation = async (id) => {
  return await api.delete(`/admin/locations/${id}`);
};