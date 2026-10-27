import api from "../../api/axios";

export const getMaterialsByCurriculum = async (curriculumId) => {
  const response = await api.get(`/admin/materials`, {
    params: { curriculum_id: curriculumId },
  });
  return response.data.data;
};

export const createMaterial = async (data) => {
  const response = await api.post(`/admin/materials`, data);
  return response.data.data;
};

export const updateMaterial = async (id, data) => {
  const response = await api.put(`/admin/materials/${id}`, data);
  return response.data.data;
};

export const deleteMaterial = async (id) => {
  const response = await api.delete(`/admin/materials/${id}`);
  return response.data;
};

export const toggleMaterialStatus = async (id) => {
  const response = await api.patch(`/admin/materials/${id}/toggle`);
  return response.data;
};

/**
 * Unggah berkas materi (PDF, Office, gambar, MP4) ke penyimpanan privat server.
 * Hasil data.path disimpan sebagai file_path materi.
 */
export const uploadMaterialFile = async (file, onUploadProgress = null) => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post("/admin/materials/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        onUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
      }
    },
  });

  return response.data;
};

// Ambil berkas materi (ber-otorisasi) sebagai blob untuk penampil dokumen
export const fetchMaterialFile = (materialId) => api.get(`/materials/${materialId}/file`, { responseType: "blob" });

// Buka penampil terlindungi di tab baru; berkas diambil dengan token login, bukan URL publik
export const openMaterialProtectedPreview = (material, user = null) => {
  if (!material?.id || !material.file_path) return;

  const userName = user?.name || user?.email || "Siswa Bimbel";
  const params = new URLSearchParams({ material: material.id, title: material.title || "Dokumen Materi", user: userName });

  window.open(`/preview/document?${params.toString()}`, "_blank", "noopener,noreferrer");
};

// Pustaka materi lintas mapel (menu Modul)
export const getMaterials = (params = {}) => api.get("/admin/materials", { params });
export const getSubjectOptions = () => api.get("/admin/subjects", { params: { per_page: 200 } });
export const getCurriculumOptions = (subjectId) => api.get("/admin/curriculums", { params: { subject_id: subjectId, per_page: 200 } });
