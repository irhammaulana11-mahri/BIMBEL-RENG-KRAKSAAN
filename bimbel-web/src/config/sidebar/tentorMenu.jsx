import React from "react";
import { LayoutDashboard,CalendarDays,FileText,User,GraduationCap,BookCheck,} from "lucide-react";
import { FaChartLine, FaMoneyCheck } from "react-icons/fa";


export const tentorMenu = [
  {
    category: null,
    menus: [{ to: "/tentor/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> }]
  },
  {
    category: "Akademik",
    menus: [
      { to: "/tentor/schedules", label: "Jadwal Belajar", icon: <CalendarDays size={20} /> },
      { to: "/tentor/progress", label: "Perkembangan Nilai", icon: <GraduationCap size={20} /> },
      { to: "/tentor/students", label: "Murid", icon: <GraduationCap size={20} /> },
      { to: "/tentor/attendances", label: "Absensi", icon: <BookCheck size={20} /> },
      { to: "/tentor/evaluations", label: "Evaluasi Murid", icon: <FaChartLine size={20} /> },
    ]
  },
  {
    category: "Administrasi",
    menus: [
      { to: "/tentor/honor", label: "Honor Saya", icon: <FaMoneyCheck size={20} /> }
    ]
  },
  {
    category: "Akun",
    menus: [{ to: "/tentor/profile", label: "Profil Saya", icon: <User size={20} /> }]
  }
];