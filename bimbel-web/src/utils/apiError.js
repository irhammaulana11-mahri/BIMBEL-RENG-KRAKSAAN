// Ambil pesan error validasi/server pertama dari respons axios
export const getApiErrorMessage = (error, fallback = "Terjadi kesalahan.") => {
  const errors = error?.response?.data?.errors;
  if (errors) return Object.values(errors)[0][0];
  return error?.response?.data?.message || fallback;
};
