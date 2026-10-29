import { adminMenu } from "./adminMenu";
import { parentMenu } from "./parentMenu";
import { tentorMenu } from "./tentorMenu";
import { studentMenu } from "./studentMenu";

export const getMenuByRole = (role) => {
  const normalizedRole = role?.toLowerCase();
  
  switch (normalizedRole) {
    case "admin":
    case "super_admin":
      return adminMenu;

    case "orang_tua":
    case "parent":
      return parentMenu;

    case "tutor":
    case "tentor":
      return tentorMenu; 

    case "student":
    case "siswa":
      return studentMenu;

    default:
      return [];
  }
};