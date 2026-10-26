import api from "@/api/axios";

/* ===================== ADMIN: EXAM ===================== */

export const getExams = (params = {}) => {
  return api.get("/admin/exams", { params });
};

export const createExam = (data) => api.post("/admin/exams", data);
export const updateExam = (id, data) => api.put(`/admin/exams/${id}`, data);
export const deleteExam = (id) => api.delete(`/admin/exams/${id}`);

// status: DRAFT | PUBLISHED | ARCHIVED
export const changeExamStatus = (id, status) => api.patch(`/admin/exams/${id}/status`, { status });

/* ===================== ADMIN: SOAL ===================== */

export const getQuestions = (examId) => api.get(`/admin/exams/${examId}/questions`);
export const createQuestion = (examId, data) => api.post(`/admin/exams/${examId}/questions`, data);
export const updateQuestion = (examId, questionId, data) => api.put(`/admin/exams/${examId}/questions/${questionId}`, data);
export const deleteQuestion = (examId, questionId) => api.delete(`/admin/exams/${examId}/questions/${questionId}`);
export const reorderQuestions = (examId, questionIds) => api.put(`/admin/exams/${examId}/questions/reorder`, { question_ids: questionIds });

/* ===================== ADMIN: HASIL ===================== */

export const getExamResults = (examId, params = {}) => api.get(`/admin/exams/${examId}/results`, { params });
export const getExamResultDetail = (resultId) => api.get(`/admin/exam-results/${resultId}`);
export const gradeExamResult = (resultId, data) => api.put(`/admin/exam-results/${resultId}/grade`, data);

/* ===================== TENTOR: HASIL & PENILAIAN ===================== */

export const getTentorExamResults = (params = {}) => api.get("/tentor/exam-results", { params });
export const getTentorExamResultDetail = (resultId) => api.get(`/tentor/exam-results/${resultId}`);
export const gradeTentorExamResult = (resultId, data) => api.put(`/tentor/exam-results/${resultId}/grade`, data);

/* ===================== SISWA: UJIAN ONLINE ===================== */

export const getStudentExams = () => api.get("/student/exams");
export const startStudentExam = (examId, sessionActivityId = null) =>
  api.post(`/student/exams/${examId}/start`, { session_activity_id: sessionActivityId });
export const getStudentExamResult = (resultId) => api.get(`/student/exam-results/${resultId}`);
export const saveStudentAnswer = (resultId, questionId, answer) =>
  api.put(`/student/exam-results/${resultId}/answers`, { question_id: questionId, answer });
export const submitStudentExam = (resultId) => api.post(`/student/exam-results/${resultId}/submit`);

export { getApiErrorMessage } from "@/utils/apiError";
