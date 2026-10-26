import { adminMenu } from "./adminMenu";
import { parentMenu } from "./parentMenu";
import { tentorMenu } from "./tentorMenu";

// Import tutorMenu dan studentMenu saat filenya sudah dibuat

export const getMenuByRole = (role) => {
  const normalizedRole = role?.toLowerCase();
  
  switch (normalizedRole) {
    case "admin":
    case "superadmin":
      return adminMenu;

    case "orang_tua":
    case "parent":
      return parentMenu;

    case "tutor":
    case "tentor":
      return tentorMenu; 

    case "student":
    case "siswa":
      return []; 

    default:
      return [];
  }
};