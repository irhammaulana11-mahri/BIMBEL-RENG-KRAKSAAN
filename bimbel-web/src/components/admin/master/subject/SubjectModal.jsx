import React, { useEffect, useState } from "react";
import { X, BookOpen } from "lucide-react";
import api from "../../../../api/axios";

export default function SubjectModal({ open, onClose, data, onSubmit, loading }) {
  const [educationLevels, setEducationLevels] = useState([]);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    education_level_id: "",
    description: "",
    is_active: true,
  });

  useEffect(() => {
    // Ambil opsi Jenjang Pendidikan secara dinamis dari API
    api.get('/admin/education-levels?is_active=1&per_page=100')
       .then(res => setEducationLevels(res.data.data))
       .catch(err => console.error(err));
  }, []);

  useEffect(() => {
    if (data) {
      setFormData({
        code: data.code || "",
        name: data.name || "",
        education_level_id: data.education_level_id || "",
        description: data.description || "",
        is_active: data.is_active ?? true,
      });
    } else {
      setFormData({ 
        code: "", 
        name: "", 
        education_level_id: "", 
        description: "",
        is_active: true,
      });
    }
  }, [data, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-2xs p-4 animate-in fade-in">
      <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95">
        <button onClick={onClose} className="absolute right-5 top-5 p-1.5 text-gray-400 hover:bg-gray-100 rounded-xl"><X size={20} /></button>

        <div className="mb-4 flex items-center gap-3">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-2xl shrink-0"><BookOpen className="w-5 h-5" /></div>
          <div>
            <h2 className="text-xl font-black text-gray-950">{data ? "Koreksi Matriks Mapel" : "Registrasi Mata Pelajaran"}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Kelola data master mata pelajaran sebagai Entry Point Kurikulum.</p>
          </div>
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(formData); }} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
            
            {/* 1. Kode (Kiri Atas) */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase">Kode Unik Mapel *</label>
              <input type="text" required value={formData.code} onChange={(e) => setFormData({...formData, code: e.target.value})} className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-mono font-bold uppercase focus:border-blue-500" placeholder="Contoh: MAT-SMP7" />
            </div>

            {/* 2. Nama Mapel (Kanan Atas) */}
            <div>
              <label className="text-[11px] font-bold text-gray-700 uppercase">Nama Mata Pelajaran *</label>
              <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-semibold focus:border-blue-500" placeholder="Contoh: Matematika" />
            </div>

            {/* 3. Jenjang Pendidikan (Kiri Tengah) */}
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-gray-700 uppercase">Jenjang Pendidikan (Education Level) *</label>
              <select required value={formData.education_level_id} onChange={(e) => setFormData({ ...formData, education_level_id: e.target.value })} className="w-full mt-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-bold text-gray-900 bg-white focus:border-blue-500">
                <option value="">-- Pilih Jenjang --</option>
                {educationLevels.map(lvl => (
                  <option key={lvl.id} value={lvl.id}>{lvl.display_name}</option>
                ))}
              </select>
            </div>

            {/* 4. Deskripsi / Silabus */}
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-gray-700 uppercase">Cakupan Deskripsi Singkat</label>
              <textarea value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-medium h-20 resize-none focus:border-blue-500" placeholder="Keterangan opsional..." />
            </div>

            {/* 5. Status Keaktifan */}
            <div className="sm:col-span-2">
              <label className="text-[11px] font-bold text-gray-700 uppercase">Status Mata Pelajaran</label>
              <select value={formData.is_active ? "true" : "false"} onChange={(e) => setFormData({ ...formData, is_active: e.target.value === "true" })} className="w-full mt-1 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-bold text-gray-900 bg-white focus:border-blue-500">
                <option value="true">Aktif (Dapat di-plotting ke kurikulum)</option>
                <option value="false">Nonaktif (Diarsipkan dari sistem)</option>
              </select>
            </div>

          </div>
          
          <div className="pt-3 border-t border-gray-100 flex gap-3 mt-4">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl text-sm font-bold">Batal</button>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold">{loading ? "Menyimpan Data..." : "Simpan Data Mapel"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
