import React from "react";
import { LayoutDashboard, ClipboardCheck, GraduationCap } from "lucide-react";

export const studentMenu = [
  {
    category: null,
    menus: [{ to: "/student/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> }]
  },
  {
    category: "Akademik",
    menus: [
      { to: "/student/exams", label: "Ujian & Hasil", icon: <ClipboardCheck size={20} /> },
      { to: "/student/reports", label: "Rapor Saya", icon: <GraduationCap size={20} /> },
    ]
  },
];
