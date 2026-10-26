import axios from "axios";
import { authStorage } from "../services/auth/authStorage";
import { triggerLogout } from "../services/auth/authEvents";

const api = axios.create({
    baseURL: "http://127.0.0.1:8001/api",
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

        if ([401, 403, 419].includes(status)) {
            triggerLogout("expired");
        }
        return Promise.reject(error);
    }
);

export default api;