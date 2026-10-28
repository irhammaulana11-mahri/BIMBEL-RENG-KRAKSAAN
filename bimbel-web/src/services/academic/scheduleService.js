import api from "../../api/axios";

export const getSchedules = async (params = {}) => {
     const query = {
        keyword: params.keyword || "",
        page: params.page || 1,
        per_page: params.perPage || 15,
    };
    return api.get("/admin/schedules", {params: query,});
  };

export const getSessions = async (params = {}) => {
     const query = {
        keyword: params.keyword || "",
        status: params.status || "",
        page: params.page || 1,
        per_page: params.perPage || 15,
    };
    return api.get("/admin/schedules/sessions", {params: query,});
  };
  


  export const getSchedule = async (id) => {
    const response = await api.get(`/admin/schedules/${id}`);
    return response.data;
};

export const createSchedule = (payload) => {
    return api.post("/admin/schedules", payload);
};


export const updateSchedule = (id, data) => {
    return api.put(`/admin/schedules/${id}`, data);
};

export const deleteSchedule = (id) => {
    return api.delete(`/admin/schedules/${id}`);
};


export const syncScheduleStudents = (classId, studentIds) => {
    return api.put(
        `/admin/schedules/${classId}/students`,
        {
            student_ids: studentIds
        }
    );
};


export const getScheduleAvailability = async (params) => {
    const response = await api.get("/admin/schedules/availability",{params});
    return response.data;
};


export const createWizardSchedule = (payload) => {
  return api.post("/admin/schedules/wizard", payload);
};

export const validateWizardSchedule = (patterns) => {
  return api.post("/admin/schedules/wizard/validate", { patterns });
};

export const cancelSession = (sessionId, data) => {
  // data = { reason: "..." }
  return api.put(`/admin/schedules/sessions/${sessionId}/cancel`, data);
};

export const updateSessionDetails = (sessionId, data) => {
  // data = { meeting_url: "...", room_name: "...", note: "..." }
  return api.put(`/admin/schedules/sessions/${sessionId}/details`, data);
};

export const validateRescheduleSession = (data) => {
  // data = { schedule_session_id, session_date, start_time, end_time, tentor_id }
  return api.post("/admin/schedules/sessions/validate-reschedule", data);
};

export const rescheduleSession = (sessionId, data) => {
  return api.put(`/admin/schedules/sessions/${sessionId}/reschedule`, data);
};

export const updateSchedulePattern = (id, data) => {
    return api.put(`/admin/schedules/${id}/pattern`, data);
};

export const toggleScheduleStatus = (id, isActive) => {
    return api.put(`/admin/schedules/${id}/toggle-status`, { is_active: isActive });
};

// Detail drawer sesi (absensi nyata, absen tentor, aktivitas, riwayat) & rekap pola jadwal
export const getSessionOverview = (sessionId) => api.get(`/admin/schedules/sessions/${sessionId}/overview`);
export const getPatternOverview = (scheduleId) => api.get(`/admin/schedules/${scheduleId}/overview`);
