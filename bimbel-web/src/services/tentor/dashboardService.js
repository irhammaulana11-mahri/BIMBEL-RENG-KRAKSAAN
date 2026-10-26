import api from "@/api/axios";

export const getTentorDashboard = () => {
    return api.get(`/tentor/dashboard`);
};