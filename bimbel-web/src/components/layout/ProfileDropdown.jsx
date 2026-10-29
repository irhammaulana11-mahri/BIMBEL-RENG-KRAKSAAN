import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Settings, LogOut, UserCircle, KeyRound } from "lucide-react";
import useAuth from "../../hooks/useAuth";
import ChangePasswordModal from "@/components/account/ChangePasswordModal";
import { updateAdminPassword } from "@/services/admin/userService";
import { useToast } from "@/hooks/useToast";
import Toast from "@/components/ui/Toast";

// Admin: Pengaturan (manajemen akun). Peran lain: Profile portal masing-masing.
const MENU_BY_ROLE = {
  admin: { label: "Pengaturan", to: "/admin/users", icon: Settings },
  super_admin: { label: "Pengaturan", to: "/admin/users", icon: Settings },
  tentor: { label: "Profile", to: "/tentor/profile", icon: UserCircle },
  orang_tua: { label: "Profile", to: "/parent/profile", icon: UserCircle },
  siswa: { label: "Profile", to: "/student/profile", icon: UserCircle },
};

const initials = (name = "") => name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase() || "U";

export default function ProfileDropdown() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const { toast, showSuccess, hideToast } = useToast();
  // Admin tidak punya halaman profil: ganti password langsung dari menu akun
  const isStaff = ["admin", "super_admin"].includes(user?.role?.role_name);

  const menu = MENU_BY_ROLE[user?.role?.role_name];

  const go = (to) => {
    setOpen(false);
    navigate(to);
  };

  const handleLogout = async () => {
    setOpen(false);
    await logout("manual");
    navigate("/login");
  };

  return (
    <div className="relative">
      <Toast show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      <ChangePasswordModal open={passwordOpen} submit={updateAdminPassword} onClose={() => setPasswordOpen(false)} onDone={(m) => { setPasswordOpen(false); showSuccess(m); }} />
      <button onClick={() => setOpen(!open)} className="flex items-center gap-3 focus:outline-none group" aria-label="Menu akun">
        <span className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-black border-2 border-white shadow-sm group-hover:ring-2 group-hover:ring-blue-300 transition-all">
          {initials(user?.name)}
        </span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

          <div className="absolute right-0 mt-2 bg-white rounded-2xl shadow-xl border border-gray-100 w-60 z-50 overflow-hidden animate-in fade-in slide-in-from-top-3 duration-200">
            <div className="p-4 border-b border-gray-100 bg-slate-50/50">
              <h4 className="font-bold text-gray-950 text-base tracking-tight capitalize truncate">{user?.name || "Pengguna"}</h4>
              <p className="text-xs font-semibold text-gray-400 font-mono truncate mt-0.5">{user?.email || user?.phone || "-"}</p>
            </div>

            <div className="p-1.5 space-y-0.5">
              {menu && (
                <button
                  onClick={() => go(menu.to)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-950 hover:bg-slate-50 rounded-xl transition-colors text-left"
                >
                  <menu.icon size={16} className="text-blue-500" />
                  {menu.label}
                </button>
              )}

              {isStaff && (
                <button
                  onClick={() => { setOpen(false); setPasswordOpen(true); }}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold text-gray-600 hover:text-gray-950 hover:bg-slate-50 rounded-xl transition-colors text-left"
                >
                  <KeyRound size={16} className="text-blue-500" />
                  Ganti Password
                </button>
              )}

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
