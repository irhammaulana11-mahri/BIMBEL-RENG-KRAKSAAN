import { useEffect, useState } from "react";
import { assetUrl } from "@/config/env";
import { getCompanyProfile } from "@/services/public/websiteService";
import { useSidebar } from "../../context/SidebarContext";
import SidebarMenu from "./sidebarMenu";

// PERBAIKAN IMPOR: Gunakan utility menu, bukan utility redirect login
import { getMenuByRole } from "../../config/sidebar/menuByRole"; 

export default function UniversalSidebar({ role }) {
  const { isExpanded, isMobileOpen } = useSidebar();
  const [company, setCompany] = useState(null);

  // PERBAIKAN FUNGSI: Ambil konfigurasi menu murni (Aman tanpa memerlukan fungsi navigate)
  const activeMenuConfig = getMenuByRole(role);

  const getInitials = (name) => {
    if (!name) return "BK";
    return name.split(" ").map(w => w.charAt(0)).join("").substring(0, 3).toUpperCase();
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

  return (
    <aside className={`fixed top-0 left-0 z-50 h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300
        ${isExpanded ? "w-72" : "w-20"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
    >
      {/* Logo Branding */}
      <div className="h-24 flex items-center justify-center px-4 shrink-0 border-b border-slate-50">
        {isExpanded ? (
          <div className="flex items-center gap-3 w-full px-2 animate-in fade-in duration-200">
            {company?.logo_url && (
              <img src={assetUrl(company.logo_url)} alt="logo" className="h-12 w-12 object-contain rounded-xl" />
            )}
            <div className="overflow-hidden">
              <h2 className="font-black text-sm text-gray-950 truncate tracking-tight">{company?.company_name}</h2>
              <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider mt-0.5">{role} Panel</p>
            </div>
          </div>
        ) : (
          <div className="animate-in fade-in duration-200">
            {company?.logo_url ? (
              <img src={assetUrl(company.logo_url)} alt="logo" className="h-11 w-11 object-contain rounded-xl" />
            ) : (
              <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                {getInitials(company?.company_name)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Render Menu Dinamis */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-track]:bg-transparent">
        {activeMenuConfig && activeMenuConfig.map((group, idx) => (
          <div key={idx} className="space-y-1">
            {group.category && isExpanded && (
              <p className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-widest text-gray-400 animate-in fade-in duration-200">
                {group.category}
              </p>
            )}
            {group.menus && group.menus.map((menu) => (
              <SidebarMenu key={menu.to} to={menu.to} label={menu.label} icon={menu.icon} />
            ))}
          </div>
        ))}
      </div>
    </aside>
  );
}


// import { useEffect, useState } from "react";
// import { 
//   LayoutDashboard, Building2, Image, Package, Calendar, FileText, MessageSquare, 
//   HelpCircle, Users, GraduationCap, BookOpen, NotebookPen, School, CalendarDays, 
//   UserPlus, ClipboardList, Shield, BookCheck, BookOpenText 
// } from "lucide-react";
// import { FaAward, FaChartLine, FaMoneyCheck, FaRegMoneyBillAlt } from "react-icons/fa";
// import { getCompanyProfile } from "@/services/public/websiteService";
// import { useSidebar } from "../../context/SidebarContext";

// // Tetap impor dari file terpisah agar modular
// import SidebarMenu from "./sidebarMenu"; 

// export default function AdminSidebar() {
//   const { isExpanded, isMobileOpen } = useSidebar();
//   const [company, setCompany] = useState(null);

//   const getInitials = (name) => {
//     if (!name) return "BK";
//     return name
//       .split(" ")
//       .map((word) => word.charAt(0))
//       .join("")
//       .substring(0, 3)
//       .toUpperCase();
//   };

//   useEffect(() => {
//     const loadCompany = async () => {
//       try {
//         const res = await getCompanyProfile();
//         setCompany(res.data.data);
//       } catch (err) {
//         console.error(err);
//       }
//     };
//     loadCompany();
//   }, []);

//   // KONFIGURASI MENU: Mengelompokkan menu agar kode JSX bersih dan rapi
//   const menuConfig = [
//     {
//       category: null, // Tanpa judul kategori
//       menus: [{ to: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard size={20} /> }]
//     },
//     {
//       category: "Master Data",
//       menus: [
//         { to: "/admin/parents", label: "Orang Tua", icon: <Users size={20} /> },
//         { to: "/admin/students", label: "Siswa", icon: <GraduationCap size={20} /> },
//         { to: "/admin/tentors", label: "Tentor", icon: <BookOpen size={20} /> },
//         { to: "/admin/subjects", label: "Mata Pelajaran", icon: <NotebookPen size={20} /> }
//       ]
//     },
//     {
//       category: "Akademik",
//       menus: [
//         { to: "/admin/classes", label: "Kelas", icon: <School size={20} /> },
//         { to: "/admin/modul", label: "Modul", icon: <BookOpenText size={20} /> },
//         { to: "/admin/schedules", label: "Jadwal", icon: <CalendarDays size={20} /> },
//         { to: "/admin/attandances", label: "Absensi", icon: <BookCheck size={20} /> },
//         { to: "/admin/exam", label: "Ujian", icon: <FaAward size={20} /> },
//         { to: "/admin/rapor", label: "Rapor", icon: <FaChartLine size={20} /> }
//       ]
//     },
//     {
//       category: "Keuangan",
//       menus: [
//         { to: "/admin/finance", label: "Pembayaran", icon: <FaMoneyCheck size={20} /> },
//         { to: "/admin/cashflow", label: "Cash Flow", icon: <FaRegMoneyBillAlt size={20} /> }
//       ]
//     },
//     {
//       category: "Pendaftaran",
//       menus: [
//         { to: "/admin/leads", label: "Lead", icon: <UserPlus size={20} /> },
//         { to: "/admin/enrollments", label: "Enrollment", icon: <ClipboardList size={20} /> }
//       ]
//     },
//     {
//       category: "Website",
//       menus: [
//         { to: "/admin/company-profile", label: "Company Profile", icon: <Building2 size={20} /> },
//         { to: "/admin/banners", label: "Banner", icon: <Image size={20} /> },
//         { to: "/admin/packages", label: "Paket", icon: <Package size={20} /> },
//         { to: "/admin/activities", label: "Kegiatan", icon: <Calendar size={20} /> },
//         { to: "/admin/articles", label: "Artikel", icon: <FileText size={20} /> },
//         { to: "/admin/testimonials", label: "Testimoni", icon: <MessageSquare size={20} /> },
//         { to: "/admin/faqs", label: "FAQ", icon: <HelpCircle size={20} /> }
//       ]
//     },
//     {
//       category: "Pengaturan",
//       menus: [{ to: "/admin/users", label: "Users", icon: <Shield size={20} /> }]
//     }
//   ];

//   return (
//     <aside className={`fixed top-0 left-0 z-50 h-screen bg-white border-r border-slate-200 flex flex-col transition-all duration-300
//         ${isExpanded ? "w-72" : "w-20"}
//         ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
//       `}
//     >
//       {/* Branding Logo Area */}
//       <div className="h-24 flex items-center justify-center px-4 shrink-0 border-b border-slate-50">
//         {isExpanded ? (
//           <div className="flex items-center gap-3 w-full px-2 animate-in fade-in duration-200">
//             {company?.logo_url && (
//               <img src={assetUrl(company.logo_url)} alt="logo" className="h-12 w-12 object-contain rounded-xl" />
//             )}
//             <div className="overflow-hidden">
//               <h2 className="font-black text-sm text-gray-950 truncate tracking-tight">{company?.company_name}</h2>
//               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-0.5">Admin Workspace</p>
//             </div>
//           </div>
//         ) : (
//           <div className="animate-in fade-in duration-200">
//             {company?.logo_url ? (
//               <img src={assetUrl(company.logo_url)} alt="logo" className="h-11 w-11 object-contain rounded-xl" />
//             ) : (
//               <div className="w-11 h-11 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
//                 {getInitials(company?.company_name)}
//               </div>
//             )}
//           </div>
//         )}
//       </div>

//       {/* Render Menu Menggunakan Looping Array Data */}
//       <div className="flex-1 overflow-y-auto p-4 space-y-4 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-200 [&::-webkit-scrollbar-track]:bg-transparent">
//         {menuConfig.map((group, idx) => (
//           <div key={idx} className="space-y-1">
//             {/* Judul Kategori Hanya Muncul Jika Sidebar Sedang Melebar */}
//             {group.category && isExpanded && (
//               <p className="px-3 pt-2 pb-1 text-[10px] font-black uppercase tracking-widest text-gray-400 animate-in fade-in duration-200">
//                 {group.category}
//               </p>
//             )}
            
//             {/* Render List Menu Internal */}
//             {group.menus.map((menu) => (
//               <SidebarMenu 
//                 key={menu.to} 
//                 to={menu.to} 
//                 label={menu.label} 
//                 icon={menu.icon} 
//               />
//             ))}
//           </div>
//         ))}
//       </div>
//     </aside>
//   );
// }