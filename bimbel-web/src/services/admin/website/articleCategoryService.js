import api from "@/api/axios";

export const getCategories = () =>
  api.get("/website/article-categories");

export const createCategory = (data) =>
  api.post("/website/article-categories", data);

export const updateCategory = (id, data) =>
  api.put(`/website/article-categories/${id}`, data);

export const deleteCategory = (id) =>
  api.delete(`/website/article-categories/${id}`);