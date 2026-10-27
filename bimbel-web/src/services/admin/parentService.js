import { Children } from "react";
import api from "../../api/axios";

export const getParents = (params = {}) => {
    const query = {
        keyword: params.keyword || "",
        status: params.status || "",
        children: params.children || "",
        page: params.page || 1,
        per_page: params.perPage || 10,
    };
    return api.get("/admin/parents", {params: query,});
  };

export const getParent = (id) => api.get(`/admin/parents/${id}`);
export const updateParent = (id,data) => api.put(`/admin/parents/${id}`, data);
export const deleteParent = (id) => api.delete(`/admin/parents/${id}`);
