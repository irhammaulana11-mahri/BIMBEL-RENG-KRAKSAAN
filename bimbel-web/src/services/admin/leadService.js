import api from "../../api/axios";


export const getLeads = (params = {}) => {
    const query = {
        keyword: params.keyword || "",
        status: params.status || "",
        period: params.period || "month",
        date: params.date || "daily",
        page: params.page || 1,
        per_page: params.perPage || 10,
    };

    return api.get("/website/leads", {params: query,});
};
export const getLead = (id) => api.get(`/website/leads/${id}`);
export const createLead = (data) => api.post("/website/leads", data);
export const updateLead = (id, data) => api.put(`/website/leads/${id}`, data);
export const deleteLead = (id) => api.delete(`/website/leads/${id}`);
export const convertLead = (id) => api.post(`/website/leads/${id}/convert`);