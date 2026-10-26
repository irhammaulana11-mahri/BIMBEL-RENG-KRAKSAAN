import React, { useEffect, useState } from "react";
import { X, Edit, Lock } from "lucide-react";

export default function StudentModal({ open, onClose, data, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    nis: "",
    full_name: "",
    gender: "L",
    birth_date: "",
    education_level: "SD",
    school_name: "",
    grade: "",
    is_active: true,
  });

  useEffect(() => {
    if (data) {
      setFormData({
        nis: data.nis || "STD" + String(data.id || "001").padStart(6, "0"),
        full_name: data.full_name || data.student_name || data.name || "",
        gender: data.gender || "L",
        birth_date: data.birth_date || "",
        education_level: data.education_level || "SD",
        school_name: data.school_name || "",
        grade: data.grade || "",
        is_active: data.user?.is_active ?? data.is_active ?? true,
      });
    } else {
      setFormData({
        nis: "OTOMATIS",
        full_name: "",
        gender: "L",
        birth_date: "",
        education_level: "SD",
        school_name: "",
        grade: "",
        is_active: true,
      });
    }
  }, [data, open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in duration-200">
      
      {/* Diperlebar menjadi max-w-2xl dengan padding ringkas agar fit tanpa scroll */}
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
        
        {/* Tombol Close */}
        <button 
          onClick={onClose} 
          type="button"
          className="absolute right-5 top-5 text-gray-400 hover:text-gray-600 transition-colors p-1.5 hover:bg-gray-100 rounded-xl"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Modal Ringkas */}
        <div className="mb-4 flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
            <Edit className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-950 tracking-tight">
              {data ? "Koreksi Profil Siswa" : "Daftarkan Siswa Baru"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Kelola data pokok identitas siswa, sekolah asal, dan status keaktifan akademik.
            </p>
          </div>
        </div>

        {/* Form Body - Grid 2 Kolom */}
        <form onSubmit={handleSubmit} className="space-y-3">
          
          <div className="border-b border-gray-100 pb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-md">
              DATA SISWA
            </span>
          </div>

          {/* GRID UTAMA FORM: 2 KOLOM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            
            {/* 1. NIS (Read Only) */}
            <div>
              <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                NIS (Nomor Induk Siswa) <Lock size={11} className="text-gray-400" />
              </label>
              <input
                type="text"
                readOnly
                value={formData.nis}
                className="w-full mt-1 rounded-xl border border-gray-200 bg-gray-100/70 px-3.5 py-2 text-sm font-mono font-bold text-gray-500 cursor-not-allowed focus:outline-none"
              />
            </div>

            {/* 2. Nama Lengkap */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Nama Lengkap Siswa</label>
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Masukkan nama lengkap..."
              />
            </div>

            {/* 3. Jenis Kelamin */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Jenis Kelamin</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="L">Laki-Laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            {/* 4. Tanggal Lahir */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Tanggal Lahir</label>
              <input
                type="date"
                value={formData.birth_date}
                onChange={(e) => setFormData({ ...formData, birth_date: e.target.value })}
                className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-900 bg-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              />
            </div>

            {/* 5. Jenjang Pendidikan */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Jenjang Pendidikan</label>
              <select
                value={formData.education_level}
                onChange={(e) => setFormData({ ...formData, education_level: e.target.value })}
                className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-900 bg-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="SD">SD / Sederajat</option>
                <option value="SMP">SMP / Sederajat</option>
                <option value="SMA">SMA / Sederajat</option>
                <option value="UMUM">UMUM / Kuliah</option>
              </select>
            </div>

            {/* 6. Tingkat Kelas */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Tingkat Kelas</label>
              <input
                type="text"
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Contoh: 4 / 12 IPA"
              />
            </div>

            {/* 7. Nama Sekolah (Mengambil 2 Kolom Jika Butuh Tempat Panjang) */}
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Nama Sekolah Asal</label>
              <input
                type="text"
                value={formData.school_name}
                onChange={(e) => setFormData({ ...formData, school_name: e.target.value })}
                className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:border-blue-500 transition-colors"
                placeholder="Contoh: MI NAHDATUL ULAMA"
              />
            </div>

            {/* 8. Status Keaktifan (Mengambil 2 Kolom) */}
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Status Keaktifan Akun</label>
              <select
                value={formData.is_active ? "true" : "false"}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })}
                className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-bold text-gray-900 bg-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="true">Aktif (Dapat mengikuti kelas bimbingan)</option>
                <option value="false">Nonaktif (Akses kelas & presensi terkunci)</option>
              </select>
            </div>

          </div>

          {/* Action Buttons */}
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