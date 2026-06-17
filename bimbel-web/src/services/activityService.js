import api from "../api/axios";

export const getActivities = () => {return api.get("/website/activities");};

export const createActivities = (data) => api.post("/website/activities",data);

export const updateActivities = (id,data) => api.put(`/website/activities/${id}`,data);

export const deleteActivities = (id) => api.delete(`/website/activities/${id}`);