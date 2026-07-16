export const redirectByRole = (role,navigate) => {

  switch (role) {

    case "super_admin":navigate("/admin/dashboard");
      break;

    case "admin":navigate("/admin/dashboard");
      break;

    case "orang_tua":navigate("/parent/dashboard");
      break;

    case "tentor":navigate("/tutor/dashboard");
      break;

    default:
      navigate("/");
  }

};