import api from "@/api/axios";

export const getStudentDashboard = () => api.get("/student/dashboard");
export const getStudentSessions = (params) => api.get("/student/sessions", { params });
export const getStudentSession = (id) => api.get(`/student/sessions/${id}`);
export const getStudentMaterials = (params = {}) => api.get("/student/materials", { params });

export const ACTIVITY_TYPE = {
  MATERIAL: { label: "Materi", className: "bg-blue-50 text-blue-700" },
  REVIEW: { label: "Review", className: "bg-indigo-50 text-indigo-700" },
  EXAM: { label: "Ujian", className: "bg-purple-50 text-purple-700" },
  DISCUSSION: { label: "Diskusi", className: "bg-teal-50 text-teal-700" },
};

export const MATERIAL_TYPE = {
  DOCUMENT: "Dokumen",
  PRESENTATION: "Presentasi",
  IMAGE: "Gambar",
  VIDEO: "Video",
  LINK: "Tautan",
};

export const getStudentProfile = () => api.get("/student/profile");
export const updateStudentPassword = (data) => api.put("/student/password", data);
