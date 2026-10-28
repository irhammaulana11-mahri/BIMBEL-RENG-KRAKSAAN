import api from "@/api/axios";

// Backup & pemulihan (Admin)
export const getBackups = () => api.get("/admin/backups");
export const getBackupStatus = () => api.get("/admin/backups/status");
export const createBackup = (data) => api.post("/admin/backups", data);
export const updateBackupSettings = (data) => api.put("/admin/backups/settings", data);
export const verifyBackup = (id) => api.get(`/admin/backups/${id}/verify`);
export const restoreBackup = (id, data) => api.post(`/admin/backups/${id}/restore`, data);
export const deleteBackup = (id) => api.delete(`/admin/backups/${id}`);

export const uploadBackup = (file, note, onProgress) => {
  const form = new FormData();
  form.append("file", file);
  if (note) form.append("note", note);
  return api.post("/admin/backups/upload", form, {
    onUploadProgress: (e) => onProgress?.(e.total ? Math.round((e.loaded / e.total) * 100) : 0),
  });
};

export const formatBytes = (bytes) => {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i ? 1 : 0)} ${units[i]}`;
};

export const TYPE_BADGE = {
  MANUAL: "bg-blue-50 text-blue-700",
  SCHEDULED: "bg-indigo-50 text-indigo-700",
  PRE_RESTORE: "bg-amber-50 text-amber-700",
  UPLOADED: "bg-purple-50 text-purple-700",
};

export const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];
