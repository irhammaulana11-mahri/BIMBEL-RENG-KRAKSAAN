import React from "react";
import { 
  LayoutDashboard, Users, GraduationCap, BookOpen, NotebookPen, 
  School, CalendarDays, BookCheck, UserPlus, ClipboardList, 
  Building2, Image, Package, Calendar, FileText, MessageSquare, HelpCircle, Shield, 
  LocateFixed,
  CircleSlash2Icon,
  Building,
  ArrowRightLeft,
  MapPinned,
  DatabaseBackup
} from "lucide-react";
import { FaAward, FaChartLine, FaMoneyCheck, FaRegMoneyBillAlt } from "react-icons/fa";

export const adminMenu = [
  {
    category: null,
    menus: [{ to: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> }]
  },
  {
    category: "Master Data",
    menus: [
      { to: "/admin/parents", label: "Orang Tua", icon: <Users size={20} /> },
      { to: "/admin/students", label: "Siswa", icon: <GraduationCap size={20} /> },
      { to: "/admin/education-levels", label: "Jenjang - Tingkat Kelas", icon: <Building size={20} /> },
      { to: "/admin/subjects", label: "Mata Pelajaran", icon: <NotebookPen size={20} /> },
      { to: "/admin/tentors", label: "Tentor", icon: <BookOpen size={20} /> },
    ]
  },
  {
    category: "Akademik",
    menus: [
      { to: "/admin/locations", label: "Lokasi", icon: <LocateFixed size={20} /> },
      { to: "/admin/classes", label: "Kelas", icon: <School size={20} /> },
      { to: "/admin/modul", label: "Modul", icon: <NotebookPen size={20} /> }, // Sesuaikan icon jika ada BookOpenText
      { to: "/admin/schedules", label: "Jadwal", icon: <CalendarDays size={20} /> },
      { to: "/admin/reschedule-requests", label: "Pengajuan Jadwal", icon: <ArrowRightLeft size={20} /> },
      { to: "/admin/location-requests", label: "Pengajuan Lokasi", icon: <MapPinned size={20} /> },
      { to: "/admin/attandances", label: "Absensi", icon: <BookCheck size={20} /> },
      { to: "/admin/exam", label: "Ujian", icon: <FaAward size={20} /> },
      { to: "/admin/rapor", label: "Rapor", icon: <FaChartLine size={20} /> }
    ]
  },
  {
    category: "Keuangan",
    menus: [
      { to: "/admin/finance", label: "Pembayaran", icon: <FaMoneyCheck size={20} /> },
      { to: "/admin/cashflow", label: "Arus Kas", icon: <FaRegMoneyBillAlt size={20} /> }
    ]
  },
  {
    category: "Pendaftaran",
    menus: [
      { to: "/admin/leads", label: "Calon Siswa", icon: <UserPlus size={20} /> },
      { to: "/admin/enrollments", label: "Pendaftaran Anak", icon: <ClipboardList size={20} /> }
    ]
  },
  {
    category: "Website",
    menus: [
      { to: "/admin/company-profile", label: "Profil Lembaga", icon: <Building2 size={20} /> },
      { to: "/admin/banners", label: "Banner", icon: <Image size={20} /> },
      { to: "/admin/packages", label: "Paket", icon: <Package size={20} /> },
      { to: "/admin/activities", label: "Kegiatan", icon: <Calendar size={20} /> },
      { to: "/admin/articles", label: "Artikel", icon: <FileText size={20} /> },
      { to: "/admin/testimonials", label: "Testimoni", icon: <MessageSquare size={20} /> },
      { to: "/admin/faqs", label: "FAQ", icon: <HelpCircle size={20} /> }
    ]
  },
  {
    category: "Pengaturan",
    menus: [
      { to: "/admin/users", label: "Akun Pengguna", icon: <Shield size={20} /> },
      // roles: menu hanya tampil untuk peran ini (server tetap memvalidasi)
      { to: "/admin/backups", label: "Backup & Pemulihan", icon: <DatabaseBackup size={20} />, roles: ["super_admin"] }
    ]
  }
];