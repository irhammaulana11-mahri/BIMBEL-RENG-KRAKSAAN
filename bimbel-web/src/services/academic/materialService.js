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
 * 🟢 POST /api/upload/document
 * Mengunggah berkas fisik (PDF, DOCX, PPTX, MP4, Gambar, dll)
 * @param {File} file - Berkas yang dipilih dari input/dropzone
 * @param {string} folder - Folder tujuan di storage public (default: 'modules')
 * @param {function} onUploadProgress - Callback opsional untuk melacak progress upload (%)
 */
export const uploadMaterialFile = async (file, folder = "modules", onUploadProgress = null) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("folder", folder);

  const response = await api.post("/uploads/document", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percentCompleted = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        onUploadProgress(percentCompleted);
      }
    },
  });

  return response.data; // Mengembalikan { success: true, data: { url, path, original_name, ... } }
};

export const getMaterialPreviewUrl = (material) => {
  if (!material) return "#";

  switch (material.material_type) {
    case "VIDEO":
      return material.video_url || material.file_path || "#";
      
    case "LINK":
      return material.external_url || "#";

    case "DOCUMENT":
    case "PRESENTATION":
    case "IMAGE":
    default:
      if (!material.file_path) return "#";
      
      // Jika file_path sudah berupa URL lengkap (http/https), langsung gunakan
      if (material.file_path.startsWith("http://") || material.file_path.startsWith("https://")) {
        return material.file_path;
      }
      
      // Jika berbentuk relative path (misal: /storage/modules/xxx.pdf), sesuaikan dengan baseURL API
      const baseURL = api.defaults.baseURL?.replace(/\/api\/?$/, "") || "";
      return `${baseURL}${material.file_path.startsWith("/") ? "" : "/"}${material.file_path}`;
  }
};

export const openMaterialProtectedPreview = (filePath, title = "Dokumen Material", user = null) => {
  if (!filePath) return;

  let streamUrl = filePath;

  // Jika berupa path lokal/storage backend
  if (!filePath.startsWith("http://") && !filePath.startsWith("https://")) {
    const cleanPath = filePath.replace(/^\/?storage\//, "");
    const apiBase = api.defaults.baseURL || "http://localhost:8000/api";
    const normalizedApi = apiBase.endsWith("/") ? apiBase.slice(0, -1) : apiBase;
    
    // Alur stream file
    streamUrl = `${normalizedApi}/files/view/${cleanPath}`;
  }

  // Dapatkan info nama user aktif
  const userName = user?.name || user?.email || "Siswa Bimbel";

  // Susun URL React Viewer dengan query param terenkripsi sederhana
  const previewAppUrl = `/preview/document?url=${encodeURIComponent(streamUrl)}&title=${encodeURIComponent(title)}&user=${encodeURIComponent(userName)}`;
  
  window.open(previewAppUrl, "_blank", "noopener,noreferrer");
};