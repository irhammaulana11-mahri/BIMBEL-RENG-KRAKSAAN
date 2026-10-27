import api from "@/api/axios";

// Dashboard Admin (ringkasan akademik, keuangan, dan pekerjaan tertunda)
export const getDashboard = async () => {
  const res = await api.get("/admin/dashboard");
  return res.data.data;
};
