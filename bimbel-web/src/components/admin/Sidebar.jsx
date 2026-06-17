import { useEffect, useState } from "react";
import { LayoutDashboard,Building2,Image,Package,Calendar,FileText,MessageSquare,HelpCircle,Users, } from "lucide-react";
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
    <aside
      className={`fixed top-0 left-0 z-50 h-screen bg-white transition-all duration-300
        ${isExpanded ? "w-72" : "w-20"}
        ${isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}
    >
      <div className="h-24 flex items-center justify-center px-4">
      {isExpanded ? (
        <div className="flex items-center gap-3">
          {company?.logo_url && (
            <img
              src={`http://127.0.0.1:8001${company.logo_url}`}
              alt="logo"
              className="h-25 w-25 object-contain"
            />
          )}

          <div>
            <h2 className="font-bold text-sm">{company?.company_name}</h2>
          </div>
        </div>
      ) : (
        <div>
          {company?.logo_url ? (
            <img
              src={`http://127.0.0.1:8001${company.logo_url}`}
              alt="logo"
              className="h-20 w-20 object-contain"
            />
          ) : (
            <div className="w-40 h-40 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
              {getInitials(company?.company_name)}
            </div>
          )}
        </div>
      )}
    </div>

      <div className="p-4 space-y-1">
        <SidebarMenu to="/admin/dashboard" label="Dashboard" icon={<LayoutDashboard size={20}/>}/>
        {isExpanded && (
          <p className="px-4 pt-4 text-xs uppercase text-gray-400">
            Website
          </p>
        )}
        <SidebarMenu to="/admin/company-profile" label="Company Profile" icon={<Building2 size={20} />}/>
        <SidebarMenu to="/admin/banners" label="Banner" icon={<Image size={20} />}/>
        <SidebarMenu to="/admin/packages" label="Paket" icon={<Package size={20} />}/>
        <SidebarMenu to="/admin/activities" label="Kegiatan" icon={<Calendar size={20} />}/>
        <SidebarMenu to="/admin/articles" label="Artikel" icon={<FileText size={20} />}/>
        <SidebarMenu to="/admin/testimonials" label="Testimoni" icon={<MessageSquare size={20} />}/>
        <SidebarMenu to="/admin/faqs" label="FAQ" icon={<HelpCircle size={20} />}/>
        <SidebarMenu to="/admin/leads" label="Leads" icon={<Users size={20} />}/>
      </div>
    </aside>
  );
}