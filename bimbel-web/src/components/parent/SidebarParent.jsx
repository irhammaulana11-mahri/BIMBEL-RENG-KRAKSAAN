import { useEffect, useState } from "react";
import { 
  LayoutDashboard, Building2, Image, Package, Calendar, FileText, MessageSquare, 
  HelpCircle, Users, GraduationCap, BookOpen, NotebookPen, School, CalendarDays, 
  UserPlus, ClipboardList, Shield, BookCheck, BookOpenText 
} from "lucide-react";
import { FaAward, FaChartLine, FaMoneyCheck, FaRegMoneyBillAlt } from "react-icons/fa";
import { getCompanyProfile } from "../../services/companyProfileService";
import { useSidebar } from "../../context/SidebarContext";

// Tetap impor dari file terpisah agar modular
import SidebarMenu from "../common/sidebarMenu"; 

export default function ParentSidebar() {
  const { isExpanded, isMobileOpen } = useSidebar();
  const [company, setCompany] = useState(null);

  const getInitials = (name) => {
    if (!name) return "BK";
    return name
      .split(" ")
      .map((word) => word.charAt(0))
      .join("")
      .substring(0, 3)
      .toUpperCase();
  };

  useEffect(() => {
    const loadCompany = async () => {
      try {
        const res = await getCompanyProfile();
        setCompany(res.data.data);
      } catch (err) {
        console.error(err);
      }
    };
    loadCompany();
  }, []);

  // KONFIGURASI MENU: Mengelompokkan menu agar kode JSX bersih dan rapi
  const menuConfig = [
    {
      category: null, // Tanpa judul kategori
      menus: [{ to: "/parent/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> }]
    },
    {
      category: "Master Data",
      menus: [
        { to: "/admin/parents", label: "Orang Tua", icon: <Users size={20} /> },
        { to: "/admin/students", label: "Siswa", icon: <GraduationCap size={20} /> },
        { to: "/admin/tentors", label: "Tentor", icon: <BookOpen size={20} /> },
        { to: "/admin/subjects", label: "Mata Pelajaran", icon: <NotebookPen size={20} /> }
      ]
    },
    {
      category: "Akademik",
      menus: [
        { to: "/admin/schedules", label: "Jadwal", icon: <CalendarDays size={20} /> },
        { to: "/admin/exam", label: "Ujian", icon: <FaAward size={20} /> },
        { to: "/admin/rapor", label: "Rapor", icon: <FaChartLine size={20} /> }
      ]
    },
    {
      category: "Keuangan",
      menus: [
        { to: "/admin/finance", label: "Pembayaran", icon: <FaMoneyCheck size={20} /> },
      ]
    },
      {
      category: "Pengaturan",
      menus: [{ to: "/admin/users", label: "Users", icon: <Shield size={20} /> }]
    }
  ];

  return (
    <aside className={`fixed top-0 left-0 z-50 h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300
        ${isExpanded ? "w-72" : "w-20"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
    >
      {/* Branding Logo Area */}
      <div className="h-24 flex items-center justify-center px-4 shrink-0 border-b border-slate-50">
        {isExpanded ? (
          <div className="flex items-center gap-3 w-full px-2 animate-in fade-in duration-200">
            {company?.logo_url && (
              <img src={`http://127.0.0.1:8001${company.logo_url}`} alt="logo" className="h-12 w-12 object-contain rounded-xl" />
            )}
            <div className="overflow-hidden">
              <h2 className="font-black text-sm text-gray-950 truncate tracking-tight">{company?.company_name}</h2>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Admin Workspace</p>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-200">
            {company?.logo_url ? (
              <img src={`http://127.0.0.1:8001${company.logo_url}`} alt="logo" className="h-11 w-11 object-contain rounded-xl" />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                {getInitials(company?.company_name)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Render Menu Menggunakan Looping Array Data */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-track]:bg-transparent">
        {menuConfig.map((group, idx) => (
          <div key={idx} className="space-y-1">
            {/* Judul Kategori Hanya Muncul Jika Sidebar Sedang Melebar */}
            {group.category && isExpanded && (
              <p className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-widest text-gray-400 animate-in fade-in duration-200">
                {group.category}
              </p>
            )}
            
            {/* Render List Menu Internal */}
            {group.menus.map((menu) => (
              <SidebarMenu 
                key={menu.to} 
                to={menu.to} 
                label={menu.label} 
                icon={menu.icon} 
              />
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}