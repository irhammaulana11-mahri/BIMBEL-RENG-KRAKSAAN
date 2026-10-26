import React, { useEffect, useState } from "react";
import { User, GraduationCap, Phone, Mail, Plus, ShieldAlert, ShieldCheck, Package } from "lucide-react";
import AddStudentModal from "../../components/admin/master/student/AddStudentModal";
import api from "../../api/axios";
import Toast from "../../components/ui/Toast";
import { useToast } from "../../hooks/useToast";

export default function ParentProfilePage() {
  const [parentData, setParentData] = useState(null);
  const [students, setStudents] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { toast, showSuccess, showError, hideToast } = useToast();

  // State Form Siswa Baru
  const [formData, setFormData] = useState({
    student_name: "",
    education_level: "SD",
    package_id: "",
    notes: ""
  });

  // Load Data Parent, Murid, dan Paket Pilihan untuk Dropdown Form
  const loadProfileData = async () => {
    try {
      setLoading(true);
      // Ganti dengan endpoint profile parent/wali Anda
      const profileRes = await api.get("/parent/profile-detail");
      setParentData(profileRes.data?.parent);
      setStudents(profileRes.data?.students || []);

      const packageRes = await api.get("/packages-list"); // Endpoint publik/master list paket
      setPackages(packageRes.data?.data || packageRes.data || []);
    } catch (err) {
      console.error(err);
      showError("Gagal memuat informasi profil.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitStudent = async (e) => {
    e.preventDefault();
    if (!formData.student_name || !formData.package_id) {
      showError("Nama siswa dan paket pilihan wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      hideToast();

      // Request penambahan anak didik baru (backend otomatis set is_active = false)
      await api.post("/parent/add-student", formData);
      
      showSuccess("Pengajuan siswa baru berhasil! Menunggu persetujuan admin.");
      setOpenModal(false);
      setFormData({ student_name: "", education_level: "SD", package_id: "", notes: "" });
      
      // Refresh Data
      loadProfileData();
    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Gagal mengajukan data siswa baru.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto relative animate-in fade-in duration-300">
      <Toast {...toast} onClose={hideToast} />

      {/* 1. Header Area */}
      <div>
        <h1 className="text-3xl font-black text-gray-950 tracking-tight">Manajemen Profil & Wali</h1>
        <p className="text-base text-gray-500 mt-1">Kelola data informasi Anda beserta riwayat status bimbingan anak didik.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* ================= DATA PRIBADI PARENT ================= */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs p-6 space-y-4 lg:col-span-1">
          <div className="flex flex-col items-center text-center pb-4 border-b border-gray-100">
            <div className="w-20 h-20 rounded-full bg-blue-50 border-2 border-blue-500/20 flex items-center justify-center text-blue-600 mb-3">
              <User size={40} className="stroke-[1.5]" />
            </div>
            <h3 className="text-lg font-black text-gray-950 tracking-tight capitalize">{parentData?.name || "Memuat..."}</h3>
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold tracking-wider uppercase mt-1">Wali Murid</span>
          </div>

          <div className="space-y-3 text-sm font-medium text-gray-600">
            <div className="flex items-center gap-3">
              <Mail size={16} className="text-gray-400" />
              <span className="truncate">{parentData?.email || "-"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone size={16} className="text-gray-400" />
              <span className="font-mono">{parentData?.phone || "-"}</span>
            </div>
          </div>
        </div>

        {/* ================= DAFTAR ANAK DIDIK (STUDENT) ================= */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-gray-950 tracking-tight">Anak Didik Bimbingan</h2>
            <button
              onClick={() => setOpenModal(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all shadow-xs"
            >
              <Plus size={16} />
              Daftarkan Siswa
            </button>
          </div>

          {/* Grid List Siswa */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {students.length === 0 && !loading && (
              <div className="col-span-2 bg-white rounded-2xl border border-gray-200 p-8 text-center text-gray-400 italic font-medium">
                Belum ada data siswa yang didaftarkan pada akun wali ini.
              </div>
            )}

            {students.map((student) => (
              <div key={student.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-xs flex flex-col justify-between hover:border-blue-500/30 transition-all duration-300 group">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-slate-50 text-slate-700 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                        <GraduationCap size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-950 text-base tracking-tight">{student.student_name}</h4>
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{student.education_level}</span>
                      </div>
                    </div>

                    {/* Badge Status Dinamis */}
                    {student.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200/50">
                        <ShieldCheck size={12} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200/50" title="Menunggu verifikasi administrasi admin">
                        <ShieldAlert size={12} /> Pending
                      </span>
                    )}
                  </div>

                  <hr className="border-gray-50" />

                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                    <Package size={16} className="text-blue-500" />
                    <span>Paket: <span className="text-gray-900 font-bold">{student.package?.package_name || "-"}</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* ================= MODAL DIALOG: DAFTAR SISWA BARU =================
      {openModal && (
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3 mb-4">
              <div>
                <h3 className="text-xl font-black text-gray-950 tracking-tight">Ajukan Siswa Baru</h3>
                <p className="text-xs text-gray-500 mt-0.5">Status awal akan non-aktif sampai disetujui Admin.</p>
              </div>
              <button onClick={() => setOpenModal(false)} className="text-gray-400 hover:text-gray-700 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleSubmitStudent} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  name="student_name"
                  value={formData.student_name}
                  onChange={handleInputChange}
                  placeholder="Contoh: Muhammad Agus"
                  className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm font-semibold focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Jenjang Pendidikan</label>
                <select
                  name="education_level"
                  value={formData.education_level}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm font-bold bg-white focus:outline-none focus:border-blue-500"
                >
                  <option value="SD">SD / Sederajat</option>
                  <option value="SMP">SMP / Sederajat</option>
                  <option value="SMA">SMA / Sederajat</option>
                  <option value="UMUM">UMUM / Kuliah</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Pilih Paket Bimbingan</label>
                <select
                  name="package_id"
                  value={formData.package_id}
                  onChange={handleInputChange}
                  className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm font-bold bg-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">-- Pilih Paket --</option>
                  {packages.map((pkg) => (
                    <option key={pkg.id} value={pkg.id}>
                      {pkg.package_name} ({pkg.price_formatted || `Rp ${pkg.price}`})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Catatan Tambahan (Opsional)</label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="Kebutuhan khusus atau fokus mapel tertentu..."
                  className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm font-medium min-h-[80px] focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setOpenModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 hover:bg-gray-50 font-bold text-sm rounded-xl transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm rounded-xl transition-all shadow-xs"
                >
                  {loading ? "Mengirim..." : "Ajukan Murid"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )} */}
      {/* Taruh komponen modal di bagian paling bawah JSX */}
      <AddStudentModal 
        open={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSuccess={""} 
      />
    </div>
  );
}