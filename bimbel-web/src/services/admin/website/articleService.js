import api from "@/api/axios";

export const getArticles = () =>
  api.get("/website/articles");

export const createArticle = (data) =>
  api.post("/website/articles", data);

export const updateArticle = (id, data) =>
  api.put(`/website/articles/${id}`, data);

export const deleteArticle = (id) =>
  api.delete(`/website/articles/${id}`);
