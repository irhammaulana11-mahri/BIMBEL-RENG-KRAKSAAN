import api from "../../api/axios";

export const getEducationLevels = (params) => {
     const query = {
        keyword: params.keyword || "",
        status: params.status || "",
        page: params.page || 1,
        per_page: params.perPage || 10,
    };
  return api.get("/admin/education-levels", {params: query,});
};

export const createEducationLevel = (data) => {
  return api.post("/admin/education-levels", data);
};

export const updateEducationLevel = (id, data) => {
  return api.put(`/admin/education-levels/${id}`, data);
};

export const toggleEducationLevelStatus = (id) => {
  return api.patch(`/admin/education-levels/${id}/toggle`);
};