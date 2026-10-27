import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { getPackages } from "@/services/public/websiteService";
import { submitLead } from "@/services/public/leadService";
import { User, Phone, Mail, GraduationCap, Layers, FileText, ArrowLeft } from "lucide-react";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";



export default function LeadRegisterPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast, showSuccess, showError, hideToast } = useToast();


  const [form, setForm] = useState({
    parent_name: "",
    phone: "",
    email: "", // Ditambahkan untuk kebutuhan data user login kelak
    student_name: "",
    education_level: "",
    package_id: "",
    notes: "",
  });

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const res = await getPackages();
      const packageData = res.data.data || [];
      setPackages(packageData);

      const selectedPackage = searchParams.get("package");
      if (selectedPackage) {
        setForm((prev) => ({ ...prev, package_id: selectedPackage }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    hideToast();
    try {
      setLoading(true);
      await submitLead(form);
      
      showSuccess("Pendaftaran berhasil! Data Anda masuk ke sistem review antrean tim kami.");
      
      // Reset form setelah sukses
      setForm({
        parent_name: "",
        phone: "",
        email: "",
        student_name: "",
        education_level: "",
        package_id: "",
        notes: "",
      });
      
    } catch (err) {
      console.error(err);
      
      // Ambil pesan error spesifik dari validasi Laravel jika ada
      const responseMessage = err.response?.data?.message;
      const validationErrors = err.response?.data?.errors;
      
      if (validationErrors) {
        // Ambil pesan error pertama yang dikembalikan oleh Laravel (entah email atau phone)
        const firstErrorKey = Object.keys(validationErrors)[0];
        showError(validationErrors[firstErrorKey][0]);
      } else if (responseMessage) {
        showError(responseMessage);
      } else {
        showError("Gagal mengirim data pendaftaran. Coba periksa kembali jaringan Anda.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-slate-50 min-h-screen py-12 flex items-center justify-center">
      <div className="w-full max-w-2xl mx-auto px-4">
        
      {/* 1. TINGGAL RENDER KOMPONEN REUSABLE DISINI */}
      <Toast {...toast} onClose={hideToast} />
        
        {/* Tombol Kembali Mini */}
        <button 
          onClick={() => navigate("/")} 
          className="mb-6 flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Kembali ke Beranda
        </button>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 md:p-10">
          <div className="text-center mb-8">
            <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
              Admission Form
            </span>
            <h1 className="text-3xl font-black text-gray-900 mt-2">Daftar Bimbingan Belajar</h1>
            <p className="text-sm text-gray-400 mt-1">
              Lengkapi formulir registrasi untuk mengajukan penempatan plot kelas & tentor privat.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Nama Orang Tua */}
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Nama Orang Tua / Wali</label>
              <div className="relative mt-1.5">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400"><User className="w-4 h-4" /></span>
                <input type="text" name="parent_name" value={form.parent_name} onChange={handleChange} required 
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500" placeholder="Contoh: Bapak Ahmad Dani" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nomor WhatsApp */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Nomor WhatsApp Aktif</label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400"><Phone className="w-4 h-4" /></span>
                  <input type="text" name="phone" value={form.phone} onChange={handleChange} required 
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500" placeholder="08xxxxxxxxxx" />
                </div>
              </div>

              {/* Email (Baru) */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Alamat Email (Untuk Akun Login)</label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400"><Mail className="w-4 h-4" /></span>
                  <input type="email" name="email" value={form.email} onChange={handleChange} required 
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500" placeholder="nama@email.com" />
                </div>
              </div>
            </div>

            <hr className="border-gray-100 my-4" />

            {/* Nama Siswa */}
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Nama Calon Siswa</label>
              <div className="relative mt-1.5">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400"><User className="w-4 h-4" /></span>
                <input type="text" name="student_name" value={form.student_name} onChange={handleChange} required 
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500" placeholder="Nama lengkap anak" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Jenjang */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Jenjang Pendidikan</label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400"><GraduationCap className="w-4 h-4" /></span>
                  <select name="education_level" value={form.education_level} onChange={handleChange} required 
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 bg-white">
                    <option value="">Pilih Jenjang</option>
                    <option value="SD">SD</option>
                    <option value="SMP">SMP</option>
                    <option value="SMA">SMA</option>
                  </select>
                </div>
              </div>

              {/* Paket */}
              <div>
                <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Pilihan Paket Belajar</label>
                <div className="relative mt-1.5">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-gray-400"><Layers className="w-4 h-4" /></span>
                  <select name="package_id" value={form.package_id} onChange={handleChange} required
                    className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 bg-white">
                    <option value="">Pilih Paket Bimbingan</option>
                    {packages.map((item) => (
                      <option key={item.id} value={item.id}>{item.package_name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Catatan Tambahan */}
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Catatan Khusus Keinginan Parent / Anak</label>
              <div className="relative mt-1.5">
                <span className="absolute top-3 left-3.5 text-gray-400"><FileText className="w-4 h-4" /></span>
                <textarea rows={3} name="notes" value={form.notes} onChange={handleChange} 
                  className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500" 
                  placeholder="Contoh: Preferensi jam belajar malam hari, atau tentor diutamakan perempuan..." />
              </div>
            </div>

            <button type="submit" disabled={loading} 
              className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-3.5 rounded-xl font-bold text-sm transition-colors shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? "Memproses Data..." : "Kirim Pengajuan Pendaftaran"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}