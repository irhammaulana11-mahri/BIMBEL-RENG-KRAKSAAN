import React, { useState, useEffect } from "react";
import { GraduationCap, Package, FileText, User, X } from "lucide-react";
import api from "../../../../api/axios";
import Toast from "../../../ui/Toast";
import { useToast } from "../../../../hooks/useToast";


export default function AddStudentModal({ open, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState([]);
  const { toast, showSuccess, showError, hideToast } = useToast();

  const [formData, setFormData] = useState({
    student_name: "",
    education_level: "SD",
    package_id: "",
    notes: "",
  });

  // Load paket bimbingan untuk drop-down pilihan
  useEffect(() => {
    if (open) {
      const loadPackages = async () => {
        try {
          const res = await api.get("/packages-list");
          setPackages(res.data?.data || res.data || []);
        } catch (err) {
          console.error("Gagal memuat daftar paket:", err);
        }
      };
      loadPackages();
    }
  }, [open]);

  if (!open) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student_name || !formData.package_id) {
      showError("Nama siswa dan paket pilihan wajib diisi.");
      return;
    }

    try {
      setLoading(true);
      hideToast();

      // Secara default di backend, status is_active otomatis diset false (pending)
      await api.post("/parent/add-student", formData);

      showSuccess("Data anak didik berhasil diajukan! Menunggu aktivasi berkas oleh Admin.");
      
      setTimeout(() => {
        onSuccess();
        onClose();
        setFormData({ student_name: "", education_level: "SD", package_id: "", notes: "" });
      }, 1200);

    } catch (err) {
      console.error(err);
      showError(err.response?.data?.message || "Gagal mengirimkan pengajuan anak didik.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="p-6">
      {/* Toast Layer lokal di atas modal */}
      <Toast {...toast} onClose={hideToast} />

      <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200">
        
        {/* Header - Mengikuti Sheet Style Visual */}
        <div className="p-5 border-b border-gray-100 bg-slate-50/50 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold tracking-wider text-blue-600 uppercase">Plotting Anak Didik</span>
            <h3 className="text-xl font-black text-gray-950 tracking-tight mt-0.5">Daftarkan Murid Baru</h3>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          
          {/* Input Nama Lengkap */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <User size={14} className="text-gray-400" /> Nama Lengkap Siswa
            </label>
            <input
              type="text"
              name="student_name"
              value={formData.student_name}
              onChange={handleChange}
              placeholder="Masukkan nama lengkap anak..."
              className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm font-semibold text-gray-800 bg-white focus:outline-none focus:border-blue-500 transition-colors"
              required
            />
          </div>

          {/* Input Jenjang */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <GraduationCap size={14} className="text-gray-400" /> Jenjang Sekolah
            </label>
            <select
              name="education_level"
              value={formData.education_level}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm font-bold text-gray-800 bg-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="SD">SD / Sederajat</option>
              <option value="SMP">SMP / Sederajat</option>
              <option value="SMA">SMA / Sederajat</option>
              <option value="UMUM">UMUM / Kuliah</option>
            </select>
          </div>

          {/* Input Paket Pilihan */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <Package size={14} className="text-gray-400" /> Opsi Paket Siswa
            </label>
            <select
              name="package_id"
              value={formData.package_id}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm font-bold text-gray-800 bg-white focus:outline-none focus:border-blue-500 transition-colors"
              required
            >
              <option value="">-- Pilih Paket Bimbingan --</option>
              {packages.map((pkg) => (
                <option key={pkg.id} value={pkg.id}>
                  {pkg.package_name} ({pkg.price_formatted || `Rp ${pkg.price}`})
                </option>
              ))}
            </select>
          </div>

          {/* Catatan Tambahan */}
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
              <FileText size={14} className="text-gray-400" /> Catatan Khusus (Opsional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Fokus kelemahan pelajaran anak atau target nilai khusus..."
              className="w-full border border-gray-200 rounded-xl p-3 mt-1.5 text-sm font-medium text-gray-700 min-h-[80px] focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex gap-3 pt-3 border-t border-gray-100 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-bold text-sm rounded-xl hover:bg-gray-50 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold text-sm rounded-xl transition-all shadow-xs"
            >
              {loading ? "Memproses..." : "+ Daftarkan Murid"}
            </button>
          </div>

        </form>
      </div>
    </div>
    </div>
  );
}