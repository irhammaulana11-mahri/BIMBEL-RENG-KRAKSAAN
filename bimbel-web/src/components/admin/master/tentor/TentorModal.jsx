import React, { useEffect, useState } from "react";
import { X, Edit, Lock, Calendar } from "lucide-react";

export default function TentorModal({ open, onClose, data, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    nik: "",
    gender: "L",
    birth_date: "",
    joining_date: "",
    education: "",
    specialization: "SAINTEK",
    address: "",
    is_active: true,
  });

  useEffect(() => {
    if (data) {
      setFormData({
        name: data.name || data.user?.name || "",
        email: data.user?.email || data.email || "",
        phone: data.phone || data.user?.phone || "",
        nik: data.nik || "",
        gender: data.gender || "L",
        birth_date: data.birth_date || "",
        joining_date: data.joining_date || new Date().toISOString().slice(0, 10),
        education: data.education || "",
        specialization: data.specialization || "SAINTEK",
        address: data.address || "",
        is_active: data.user?.is_active ?? data.is_active ?? true,
      });
    }
  }, [data, open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
        
        <button 
          onClick={onClose} 
          type="button"
          className="absolute right-5 top-5 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="mb-4 flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
            <Edit size={20} />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-950 tracking-tight">Koreksi Profil Tentor</h2>
            <p className="text-xs text-gray-400 mt-0.5">Perbarui biodata pokok, kontak, dan kualifikasi tenaga pengajar.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="border-b border-gray-100 pb-1.5">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-md">
              BIODATA & AKUN TENTOR
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Nama Lengkap Tentor</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:border-blue-500"
                placeholder="Nama lengkap..."
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                Email Login <Lock size={11} className="text-gray-400" />
              </label>
              <input
                type="email"
                readOnly
                value={formData.email}
                className="w-full mt-1 rounded-xl border border-gray-200 bg-gray-100/70 px-3.5 py-2 text-sm font-bold text-gray-500 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">No. WhatsApp / HP</label>
              <input
                type="text"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-mono font-bold text-gray-900 focus:outline-none focus:border-blue-500"
                placeholder="081234567890"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">NIK</label>
              <input
                type="text"
                value={formData.nik}
                onChange={(e) => setFormData({ ...formData, nik: e.target.value })}
                className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-mono font-bold text-gray-900 focus:outline-none focus:border-blue-500"
                placeholder="35130..."
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Jenis Kelamin</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="L">Laki-Laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Tanggal Lahir</label>
              <input
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
              />
            </div>

            {/* Tanggal Bergabung */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Tanggal Bergabung</label>
              <input
                type="date"
                value={formData.joining_date}
                onChange={(e) => setFormData({ ...formData, joining_date: e.target.value })}
                className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Pendidikan Terakhir</label>
              <input
                type="text"
                value={formData.education}
                onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:border-blue-500"
                placeholder="Contoh: S1 Matematika"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Kluster Spesialisasi</label>
              <select
                value={formData.specialization}
                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-900 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="SAINTEK">Saintek (IPA/MTK/Sains)</option>
                <option value="SOSHUM">Soshum (IPS/Sosial)</option>
                <option value="BAHASA">Bahasa & Literasi</option>
                <option value="UMUM">Umum / Semua Jenjang</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Alamat Domisili</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:border-blue-500"
                placeholder="Contoh: Jl. Merdeka No. 45, Kraksaan"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Status Keaktifan Tentor</label>
              <select
                value={formData.is_active ? "true" : "false"}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })}
                className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-bold text-gray-900 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                <option value="true">Aktif (Dapat di-plotting jadwal & mapel)</option>
                <option value="false">Nonaktif (Akses mengajar terkunci)</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex gap-3 mt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-bold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-xl text-sm font-bold shadow-xs transition-all cursor-pointer"
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}