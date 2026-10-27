import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, LogOut, Activity } from "lucide-react"; 
import { profile } from "@/services/auth/authService";
import useAuth from "../../hooks/useAuth";

export default function ProfileDropdown() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user_role");
    localStorage.removeItem("lastActivity");
    navigate("/login");
    logout("manual");

  };

  useEffect(() => {
    const loadUserData = async () => {
      try {
        const res = await profile();
        setUser(res.data);
      } catch (err) {
        console.error("Gagal memuat profil user login:", err);
      }
    };
    
    loadUserData();
  }, []);

  return (
    <div className="relative">
      {/* Tombol Pemicu Dropdown */}
      <button 
        onClick={() => setOpen(!open)} 
        className="flex items-center gap-3 focus:outline-none group"
      >
        <img 
          src="https://i.pravatar.cc/40" 
          alt="avatar user" 
          className="w-10 h-10 rounded-full border border-slate-200 group-hover:border-blue-500/50 transition-all duration-200"
        />
      </button>

      {/* Konten Menu Dropdown Melayang */}
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          
          <div className="absolute right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 w-60 z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
            {/* Header Profil */}
            <div className="p-4 border-b border-gray-100 bg-slate-50/50">
              <h4 className="font-bold text-gray-950 text-base tracking-tight capitalize">
                {user?.name || "User Bimbel"}
              </h4>
              <p className="text-xs font-semibold text-gray-400 font-mono truncate mt-0.5">
                {user?.email || user?.phone || "belum_set_email@bimbel.id"}
              </p>
            </div>

            {/* List Aksi Menu Navigasi Peran */}
            <div className="p-1.5 space-y-0.5">
              <button 
                onClick={() => { navigate("/admin/profile"); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-950 hover:bg-slate-50 rounded-xl transition-colors text-left"
              >
                <Activity size={16} className="text-emerald-500" />
                Profile
              </button>
              
              <button 
                onClick={() => { navigate("/admin/settings"); setOpen(false); }}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-950 hover:bg-slate-50 rounded-xl transition-colors text-left"
              >
                <Settings size={16} className="text-gray-400" />
                Pengaturan
              </button>
              
              <hr className="border-gray-100 my-1 mx-1.5" />
              
              <button 
                onClick={handleLogout} 
                className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}