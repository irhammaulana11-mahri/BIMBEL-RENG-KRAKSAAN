import React from "react";
import { LayoutDashboard, Calendar, FileText, User, GraduationCap, ClipboardCheck } from "lucide-react";
import { FaMoneyBill } from "react-icons/fa";

export const parentMenu = [
  {
    category: null,
    menus: [{ to: "/parent/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> }]
  },
  {
    category: "Monitoring Anak",
    menus: [
      { to: "/parent/schedule", label: "Jadwal Belajar", icon: <Calendar size={20} /> },
      { to: "/parent/exam", label: "Hasil Ujian", icon: <ClipboardCheck size={20} /> },
      { to: "/parent/grades", label: "Perkembangan Nilai", icon: <GraduationCap size={20} /> }
    ]
  },
  {
    category: "Administrasi",
    menus: [
      { to: "/parent/billing", label: "Tagihan & Riwayat", icon: <FileText size={20} /> },
      { to: "/parent/finance", label: "Keuangan", icon: <FaMoneyBill size={20} /> }
    ]
  },
  {
    category: "Akun",
    menus: [{ to: "/parent/profile", label: "Profil Saya", icon: <User size={20} /> }]
  }
];