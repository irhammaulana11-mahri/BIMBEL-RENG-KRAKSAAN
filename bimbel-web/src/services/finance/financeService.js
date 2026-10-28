import api from "@/api/axios";

/* ===================== ADMIN: TAGIHAN ===================== */

export const getInvoices = (params = {}) => api.get("/admin/finance/invoices", { params });
export const getInvoice = (id) => api.get(`/admin/finance/invoices/${id}`);
export const createInvoice = (data) => api.post("/admin/finance/invoices", data);
export const previewInvoices = (data) => api.post("/admin/finance/invoices/preview", data);
export const generateInvoices = (data) => api.post("/admin/finance/invoices/generate", data);
export const cancelInvoice = (id, reason) => api.patch(`/admin/finance/invoices/${id}/cancel`, { reason });

/* ===================== ADMIN: PEMBAYARAN ===================== */

export const getPayments = (params = {}) => api.get("/admin/finance/payments", { params });
export const recordPayment = (data) => api.post("/admin/finance/payments", data);
export const approvePayment = (id) => api.patch(`/admin/finance/payments/${id}/approve`);
export const rejectPayment = (id, reason) => api.patch(`/admin/finance/payments/${id}/reject`, { reason });
export const getPaymentProof = (id) => api.get(`/admin/finance/payments/${id}/proof`, { responseType: "blob" });

/* ===================== ADMIN: HONOR TENTOR ===================== */

export const getPayrolls = (params = {}) => api.get("/admin/finance/payrolls", { params });
export const previewPayroll = (period) => api.get("/admin/finance/payrolls/preview", { params: { period } });
export const generatePayroll = (period) => api.post("/admin/finance/payrolls/generate", { period });
export const getPayroll = (id) => api.get(`/admin/finance/payrolls/${id}`);
export const approvePayroll = (id) => api.patch(`/admin/finance/payrolls/${id}/approve`);
export const deletePayroll = (id) => api.delete(`/admin/finance/payrolls/${id}`);
export const transferPayroll = (id, data) => api.post(`/admin/finance/payrolls/${id}/transfers`, data);
export const getTentorRates = () => api.get("/admin/finance/tentor-rates");

/* ===================== ADMIN: ATURAN TARIF (RULE ENGINE) ===================== */

export const getFeeRules = () => api.get("/admin/finance/fee-rules");
export const createFeeRule = (data) => api.post("/admin/finance/fee-rules", data);
export const updateFeeRule = (id, data) => api.put(`/admin/finance/fee-rules/${id}`, data);
export const deleteFeeRule = (id) => api.delete(`/admin/finance/fee-rules/${id}`);
export const updateTentorRate = (tentorId, rate) => api.patch(`/admin/finance/tentor-rates/${tentorId}`, { rate_per_session: rate });

/* ===================== ADMIN: PENGELUARAN & ARUS KAS ===================== */

export const getCashflow = (period) => api.get("/admin/finance/cashflow", { params: { period } });
export const getExpenses = (params = {}) => api.get("/admin/finance/expenses", { params });
export const createExpense = (data) => api.post("/admin/finance/expenses", data);
export const updateExpense = (id, data) => api.put(`/admin/finance/expenses/${id}`, data);
export const deleteExpense = (id) => api.delete(`/admin/finance/expenses/${id}`);

/* ===================== ORANG TUA ===================== */

export const getParentInvoices = (params = {}) => api.get("/parent/invoices", { params });
export const getParentInvoice = (id) => api.get(`/parent/invoices/${id}`);
export const getParentPayments = () => api.get("/parent/payments");
export const getParentPaymentProof = (id) => api.get(`/parent/payments/${id}/proof`, { responseType: "blob" });
export const submitParentPayment = (invoiceId, formData) =>
  api.post(`/parent/invoices/${invoiceId}/payments`, formData, { headers: { "Content-Type": "multipart/form-data" } });

/* ===================== TENTOR ===================== */

export const getTentorHonor = () => api.get("/tentor/honor");

export const INVOICE_STATUS = {
  UNPAID: { label: "Belum Bayar", className: "bg-rose-50 text-rose-700" },
  PARTIAL: { label: "Sebagian", className: "bg-amber-50 text-amber-700" },
  PAID: { label: "Lunas", className: "bg-emerald-50 text-emerald-700" },
  CANCELLED: { label: "Dibatalkan", className: "bg-gray-100 text-gray-500" },
};

export const PAYMENT_STATUS = {
  PENDING: { label: "Menunggu Verifikasi", className: "bg-amber-50 text-amber-700" },
  CONFIRMED: { label: "Diterima", className: "bg-emerald-50 text-emerald-700" },
  REJECTED: { label: "Ditolak", className: "bg-rose-50 text-rose-700" },
};

export const PAYROLL_STATUS = {
  DRAFT: { label: "Draft", className: "bg-gray-100 text-gray-600" },
  APPROVED: { label: "Disetujui", className: "bg-blue-50 text-blue-700" },
  PAID: { label: "Lunas Dibayar", className: "bg-emerald-50 text-emerald-700" },
};
