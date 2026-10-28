import api from "../../api/axios";

export const getStudents = async (params = {}) => {
     const query = {
        keyword: params.keyword || "",
        status: params.status || "",
        education_level: params.education_level || "",
        page: params.page || 1,
        per_page: params.perPage || 10,
    };
    return api.get("/admin/students", {params: query,});
  };

export const getStudent = async (id) => {
    const response = await api.get(`/admin/students/${id}`);
    return response.data;
};

export const createStudent = (payload) => {
    return api.post("/admin/students", payload);
};


export const updateStudent = (id, data) => {
    return api.put(`/admin/students/${id}`, data);
};


export const toggleStudentStatus = (id) => {
  return api.patch(`/admin/students/${id}/toggle`);
};


export const deleteStudent = (id) => {
    return api.delete(`/admin/students/${id}`);
};

// Data drawer detail (wali, kelas, jadwal, kehadiran, nilai, tagihan, akun)
export const getStudentOverview = (id) => api.get(`/admin/students/${id}/overview`);

// Buat akun login siswa; password kosong = dibuatkan sementara oleh server
export const createStudentAccount = (id, data) => api.post(`/admin/students/${id}/account`, data);
