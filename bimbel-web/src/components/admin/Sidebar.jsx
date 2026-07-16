import { useEffect, useState } from "react";
import { LayoutDashboard,Building2,Image,Package,Calendar,FileText,MessageSquare,HelpCircle,Users,
  GraduationCap, BookOpen, NotebookPen, School, CalendarDays, MapPin, UserPlus, ClipboardList, Shield
 } from "lucide-react";
import { getCompanyProfile } from "../../services/companyProfileService";
import SidebarMenu from "./sidebarMenu";
import { useSidebar } from "../../context/SidebarContext";

export default function AdminSidebar() {
  const {isExpanded,isMobileOpen,} = useSidebar();
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

  const loadCompany = async () => {
    try {
      const res = await getCompanyProfile();
      setCompany(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCompany();
  }, []);

  return (
    <aside className={`fixed top-0 left-0 z-50 h-screen bg-white border-r border-slate-200 flex flex-col
        transition-all duration-300
        ${isExpanded ? "w-72" : "w-20"}
        ${isMobileOpen
            ? "translate-x-0"
            : "-translate-x-full lg:translate-x-0"
        }
      `}
    >
            {/* Logo Area */}
      <div className="h-24 flex items-center justify-center px-4  shrink-0">
        {isExpanded ? (
          <div className="flex items-center gap-3">
            {company?.logo_url && (
              <img
                src={`http://127.0.0.1:8001${company.logo_url}`}
                alt="logo"
                className="h-20 w-20 object-contain"
              />
            )}

            <div>
              <h2 className="font-bold text-sm">{company?.company_name}</h2>
            </div>
          </div>
        ) : (
          <>
            {company?.logo_url ? (
              <img
                src={`http://127.0.0.1:8001${company.logo_url}`}
                alt="logo"
                className="h-16 w-16 object-contain"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                {getInitials(company?.company_name)}
              </div>
            )}
          </>
        )}
      </div>

      {/* Scrollable Menu */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-thumb]:bg-slate-300
        [&::-webkit-scrollbar-track]:bg-transparent"
      >
        {/* DASHBOARD */}
        <SidebarMenu to="/admin/dashboard" label="Dashboard" icon={<LayoutDashboard size={20} />}/>

        {/* MASTER DATA */}
        {isExpanded && (
          <p className="px-4 pt-4 text-xs uppercase text-gray-400">Master Data</p>
        )}

        <SidebarMenu to="/admin/parents" label="Orang Tua" icon={<Users size={20} />}/>
        <SidebarMenu to="/admin/students" label="Siswa" icon={<GraduationCap size={20} />}/>
        <SidebarMenu to="/admin/tutors" label="Tentor" icon={<BookOpen size={20} />}/>
        <SidebarMenu to="/admin/subjects" label="Mata Pelajaran" icon={<NotebookPen size={20} />}/>

        {/* AKADEMIK */}
        {isExpanded && (
          <p className="px-4 pt-4 text-xs uppercase text-gray-400">Akademik</p>
        )}
        <SidebarMenu to="/admin/classes" label="Kelas" icon={<School size={20} />}/>
        <SidebarMenu to="/admin/schedules" label="Jadwal"icon={<CalendarDays size={20} />}/>
        <SidebarMenu to="/admin/locations" label="Lokasi Belajar" icon={<MapPin size={20} />}/>

        {/* PENDAFTARAN */}
        {isExpanded && (
          <p className="px-4 pt-4 text-xs uppercase text-gray-400">Pendaftaran</p>
        )}
        <SidebarMenu to="/admin/leads" label="Lead" icon={<UserPlus size={20} />}/>
        <SidebarMenu to="/admin/enrollments" label="Enrollment" icon={<ClipboardList size={20} />}/>

        {/* WEBSITE */}
        {isExpanded && (
          <p className="px-4 pt-4 text-xs uppercase text-gray-400">Website</p>
        )}

        <SidebarMenu to="/admin/company-profile" label="Company Profile" icon={<Building2 size={20} />}/>
        <SidebarMenu to="/admin/banners" label="Banner" icon={<Image size={20} />}/>
        <SidebarMenu to="/admin/packages" label="Paket" icon={<Package size={20} />}/>
        <SidebarMenu to="/admin/activities" label="Kegiatan" icon={<Calendar size={20} />}/>
        <SidebarMenu to="/admin/articles" label="Artikel" icon={<FileText size={20} />}/>
        <SidebarMenu to="/admin/testimonials" label="Testimoni" icon={<MessageSquare size={20} />}/>
        <SidebarMenu to="/admin/faqs" label="FAQ" icon={<HelpCircle size={20} />}/>

        {/* PENGATURAN */}
        {isExpanded && (
          <p className="px-4 pt-4 text-xs uppercase text-gray-400">Pengaturan</p>
        )}

        <SidebarMenu to="/admin/users" label="Users" icon={<Shield size={20} />}/>
      </div>
    </aside>
  );
}