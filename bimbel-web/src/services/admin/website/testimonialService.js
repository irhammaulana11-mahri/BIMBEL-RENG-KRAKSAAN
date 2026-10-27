import api from "@/api/axios";

export const getTestimonials = () => api.get("/website/testimonials");
export const createTestimonial = (data) => api.post("/website/testimonials", data);
export const updateTestimonial = (id, data) => api.put(`/website/testimonials/${id}`, data);
export const deleteTestimonial = (id) => api.delete(`/website/testimonials/${id}`);
