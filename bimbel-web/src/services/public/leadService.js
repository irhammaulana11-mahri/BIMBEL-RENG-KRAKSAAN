import api from "@/api/axios";

// Formulir pendaftaran calon siswa dari website (tanpa login)
export const submitLead = (data) => api.post("/website/leads", data);
