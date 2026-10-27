// Alamat backend (Laravel). Atur VITE_API_URL di .env saat build untuk server lain.
export const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8001").replace(/\/+$/, "");
export const API_BASE_URL = `${API_ORIGIN}/api`;

// URL berkas publik dari backend (mis. "/storage/general/x.png"); URL penuh dibiarkan apa adanya
export const assetUrl = (path) => {
  if (!path) return "";
  if (/^(https?:|data:|blob:)/.test(path)) return path;
  return `${API_ORIGIN}${path.startsWith("/") ? "" : "/"}${path}`;
};
