import api from "../api/axios";

export const getBanners = () => {return api.get("/website/banners");};

export const createBanner = (data) => api.post("/website/banners",data);

export const updateBanner = (id,data) => api.put(`/website/banners/${id}`,data);

export const deleteBanner = (id) => api.delete(`/website/banners/${id}`);