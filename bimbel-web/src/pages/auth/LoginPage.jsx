import { useState, useEffect } from "react";
import { login as loginApi } from "../../services/auth/authService";
import { redirectByRole } from "../../services/utils/redirectByRole";
import useAuth from "../../hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";
import { Mail, Lock, LogIn, AlertCircle, CheckCircle2, X } from "lucide-react";

// Impor reusable komponen & hook
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";
import { useForceLightTheme } from "../../context/ThemeContext";

export default function LoginPage() {
  useForceLightTheme();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast, showSuccess, showError, hideToast } = useToast();
  const location = useLocation();
  const { login } = useAuth();
  

  const handleLogin = async (e) => {
    e.preventDefault();
    hideToast();
    
    try {
      setLoading(true);
      const response = await loginApi({email,password});
      showSuccess("Autentikasi Berhasil! Selamat datang kembali.");      
      const userRole = await login(response.data.token);

      // Beri jeda 1.2 detik agar user sempat membaca pesan Toast Sukses
      setTimeout(() => {redirectByRole(userRole, navigate);}, 1200);
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Kombinasi email atau kata sandi Anda salah.");
    } finally {
      setLoading(false);
    }
  };


  useEffect(()=>{
      const reason = location.state?.reason;

      switch(reason){
          case "idle":
              showError("Sesi berakhir karena tidak ada aktivitas.");
              break;

          case "expired":
              showError("Sesi login telah berakhir. Silakan masuk kembali.");
              break;

          case "unauthorized":
              showError("Anda tidak memiliki hak akses.");
              break;
      }
  },[]);


  return (
    <div className="min-h-screen flex bg-slate-50 relative">
      
      {/* 1. TINGGAL RENDER KOMPONEN REUSABLE DISINI */}
      <Toast {...toast} onClose={hideToast} />


      {/* SISI KIRI - ILUSTRASI BRANDING */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 to-indigo-700 text-white relative p-12 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-90 h-90 bg-blue-500/20 rounded-full blur-3xl" />
        
        <div className="m-auto max-w-lg text-center space-y-4">
          <h1 className="text-4xl font-black tracking-tight leading-tight">
            Sistem Informasi Akademik & Keuangan Bimbel
          </h1>
          <p className="text-blue-100 text-sm font-medium leading-relaxed">
            Kelola monitoring jadwal mengajar tatap muka, distribusi modul ujian cetak, dan rekap penggajian komparasi operational finansial secara realtime terpusat.
          </p>
          <div className="pt-6">
            <img
              src="/images/login-illustration.png"
              alt="Bimbel Kraksaan Portal Admin"
              className="w-80 mx-auto drop-shadow-2xl"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        </div>
      </div>

      {/* SISI KANAN - FORM UTAMA INPUT */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
        <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-3xl shadow-xl border border-gray-100">
          
          <div className="text-center mb-8">
            <div className="h-14 w-14 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <LogIn className="w-6 h-6 text-blue-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-950">Selamat Datang Kembali</h2>
            <p className="text-xs text-gray-400 mt-1">Silakan masukkan akun kredensial Anda yang terdaftar resmi</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Alamat Email</label>
              <div className="relative mt-1.5">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-medium text-gray-800"
                  placeholder="nama@email.com"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Kata Sandi (Password)</label>
              <div className="relative mt-1.5">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 font-medium text-gray-800"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl text-sm font-bold transition-all shadow-sm flex items-center justify-center gap-2 mt-2"
            >
              {loading ? "Menautkan Kredensial..." : "Masuk ke Sistem"}
            </button>
          </form>
        </div>
      </div>

    </div>
  );
}