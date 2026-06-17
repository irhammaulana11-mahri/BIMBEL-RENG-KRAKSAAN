import api from "../api/axios";

export const getFaqs = () =>
  api.get("/website/faqs");

export const createFaq = (data) =>
  api.post("/website/faqs", data);

export const updateFaq = (id, data) =>
  api.put(`/website/faqs/${id}`, data);

export const deleteFaq = (id) =>
  api.delete(`/website/faqs/${id}`);