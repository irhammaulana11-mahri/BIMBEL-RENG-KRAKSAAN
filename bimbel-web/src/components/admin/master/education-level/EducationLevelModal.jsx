import React, { useEffect, useState } from "react";
import { X, GraduationCap } from "lucide-react";

export default function EducationLevelModal({ open, onClose, data, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    level_code: "",
    education_level: "",
    grade_level: "",
    display_name: "",
    sort_order: 1,
    is_active: true,
    description: "",
  });

  useEffect(() => {
    if (data) {
      setFormData({
        level_code: data.level_code || "",
        education_level: data.education_level || "",
        grade_level: data.grade_level || "",
        display_name: data.display_name || "",
        sort_order: data.sort_order ?? 1,
        is_active: data.is_active ?? true,
        description: data.description || "",
      });
    } else {
      setFormData({
        level_code: "",
        education_level: "",
        grade_level: "",
        display_name: "",
        sort_order: 1,
        is_active: true,
        description: "",
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
      
      {/* Diperlebar ke max-w-2xl agar menampung 2 kolom dengan lega */}
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200">
        
        <button 
          onClick={onClose} 
          type="button"
          className="absolute right-5 top-5 p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Header Modal */}
        <div className="mb-4 flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-950 tracking-tight">
              {data ? "Koreksi Education Level" : "Registrasi Education Level"}
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Kelola master jenjang pendidikan, grade, dan urutan hierarki.
            </p>
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="space-y-3">
          
          <div className="border-b border-gray-100 pb-1.5 flex items-center justify-between">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-0.5 rounded-md">
              INFORMASI JENJANG
            </span>
          </div>

          {/* GRID UTAMA FORM: 2 KOLOM */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            
            {/* 1. Kode Jenjang */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                Kode Unik {data && <span className="text-red-500 lowercase normal-case text-[10px]">(Tidak dapat diubah)</span>}
              </label>
              <input 
                type="text" 
                required
                disabled={!!data} // 🟢 MENGUNCI INPUT JIKA MODE EDIT (data ada isinya)
                value={formData.level_code} 
                onChange={(e) => setFormData({...formData, level_code: e.target.value})} 
                className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-mono font-bold uppercase focus:outline-none focus:border-blue-500 transition-colors disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed" 
                placeholder="Contoh: SMA-10"
              />
            </div>

            {/* 2. Jenjang Utama */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Kategori Jenjang</label>
              <input 
                type="text" 
                required
                value={formData.education_level} 
                onChange={(e) => setFormData({...formData, education_level: e.target.value})} 
                className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-bold uppercase focus:outline-none focus:border-blue-500 transition-colors" 
                placeholder="Contoh: SMA"
              />
            </div>

            {/* 3. Grade */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Grade (Tingkatan)</label>
              <input 
                type="number" 
                required
                min="1"
                value={formData.grade_level} 
                onChange={(e) => setFormData({...formData, grade_level: e.target.value})} 
                className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-bold focus:outline-none focus:border-blue-500 transition-colors" 
                placeholder="Contoh: 10"
              />
            </div>

            {/* 4. Sort Order */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Urutan Tampil (Sort Order)</label>
              <input 
                type="number"
                value={formData.sort_order} 
                onChange={(e) => setFormData({...formData, sort_order: e.target.value})} 
                className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-bold focus:outline-none focus:border-blue-500 transition-colors" 
                placeholder="Contoh: 1"
              />
            </div>

            {/* 5. Display Name (Full Width / 2 Kolom) */}
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Nama Tampilan (Display Name)</label>
              <input 
                type="text" 
                required
                value={formData.display_name} 
                onChange={(e) => setFormData({...formData, display_name: e.target.value})} 
                className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold text-gray-900 focus:outline-none focus:border-blue-500 transition-colors" 
                placeholder="Contoh: SMA Kelas 10" 
              />
            </div>

            {/* 6. Deskripsi (Full Width / 2 Kolom) */}
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Deskripsi Tambahan</label>
              <textarea 
                value={formData.description} 
                onChange={(e) => setFormData({...formData, description: e.target.value})} 
                className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-700 h-20 resize-none focus:outline-none focus:border-blue-500 transition-colors leading-relaxed" 
                placeholder="Keterangan opsional..." 
              />
            </div>

            {/* 7. Status Keaktifan (Full Width / 2 Kolom) */}
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">Status Education Level</label>
              <select
                value={formData.is_active ? "true" : "false"}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })}
                className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-bold text-gray-900 bg-white focus:outline-none focus:border-blue-500 transition-colors cursor-pointer"
              >
                <option value="true">Aktif (Dapat digunakan di pembuatan Mapel & Kelas)</option>
                <option value="false">Nonaktif (Sembunyikan dari pilihan sistem)</option>
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
              {loading ? "Menyimpan Data..." : "Simpan Data Level"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}