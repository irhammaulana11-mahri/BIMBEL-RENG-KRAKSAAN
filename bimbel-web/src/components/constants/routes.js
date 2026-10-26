export const APP_ROUTES = {
    TENTOR: {
        DASHBOARD: "/tentor/dashboard",
        SCHEDULES: "/tentor/schedules",
        // Fungsi untuk mengenerate dynamic route
        WORKSPACE: (sessionId) => `/tentor/sessions/${sessionId}/workspace`
    }
};