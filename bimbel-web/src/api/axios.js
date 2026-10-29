import axios from "axios";
import { API_BASE_URL } from "../config/env";
import { authStorage } from "../services/auth/authStorage";
import { triggerLogout } from "../services/auth/authEvents";

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {Accept: "application/json",},
});

/**
 * Request Interceptor
 */
api.interceptors.request.use(
    (config) => {
        const token = authStorage.getToken();

        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

/**
 * Response Interceptor
 */
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status;

        // Hanya permintaan bertoken yang berarti sesi habis; 401 saat login = email/password salah.
        // 403 = sesi masih sah tetapi tidak berhak atas data itu: tampilkan pesan, jangan keluarkan pengguna.
        if ([401, 419].includes(status) && error.config?.headers?.Authorization) {
            triggerLogout("expired");
        }
        return Promise.reject(error);
    }
);

export default api;