export const redirectByRole = (user, navigate) => {
  switch (user.role.role_name) {
    case "admin":
    case "superadmin":
      navigate("/admin/dashboard");
      break;
      
    case "orang_tua":
    case "parent":
      navigate("/parent/dashboard");
      break;
      
    case "tutor":
    case "tentor":
      navigate("/tentor/dashboard"); // Arahkan ke dashboard tutor kelak
      break;
      
    case "student":
    case "siswa":
      navigate("/student/dashboard"); // Arahkan ke dashboard siswa kelak
      break;
      
    default:
      navigate("/"); // Fallback ke beranda jika role tidak dikenali
      break;
  }
};
