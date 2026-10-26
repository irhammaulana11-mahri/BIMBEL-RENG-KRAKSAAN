import React, { useEffect, useState } from "react";
import { X, UploadCloud, Lock, BookOpen } from "lucide-react";

export default function MaterialModal({ open, onClose, data, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    title: "",
    subject_id: "",
    education_level: "12 SMA",
    allowed_package_id: "",
    file: null
  });

  useEffect(() => {
    if (data) {
      setFormData({
        title: data.title || "",
        subject_id: data.subject_id || "",
        education_level: data.education_level || "12 SMA",
        allowed_package_id: data.allowed_package_id || "",
        file: null
      });
    } else {
      setFormData({ title: "", subject_id: "", education_level: "12 SMA", allowed_package_id: "", file: null });
    }
  }, [data, open]);

  if (!open) return null;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl relative max-h-[92vh] overflow-y-auto animate-in zoom-in-95 duration-200">
        <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5 flex items-start gap-2.5">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-950">{data ? "Koreksi Profil Modul" : "Upload Dokumen Ajar Baru"}</h2>
            <p className="text-xs text-gray-400 mt-0.5">Sediakan file silabus berkualitas tinggi untuk kebutuhan belajar mandiri siswa.</p>
          </div>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Judul / Nama Materi Ajar</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Contoh: Rangkuman Rahasia Sukses UTBK Fisika Kuantum"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Mata Pelajaran</label>
              <select
                required
                value={formData.subject_id}
                onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white focus:outline-none"
              >
                <option value="">Pilih Mapel Induk</option>
                <option value="101">Matematika Peminatan</option>
                <option value="102">Sosiologi Dasar</option>
                <option value="103">Fisika Klasik</option>
              </select>
            </div>
            
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Tingkatan Sekolah</label>
              <select
                value={formData.education_level}
                onChange={(e) => setFormData({...formData, education_level: e.target.value})}
                className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white focus:outline-none"
              >
                <option value="10 SMA">10 SMA</option>
                <option value="11 SMA">11 SMA</option>
                <option value="12 SMA">12 SMA</option>
                <option value="9 SMP">9 SMP</option>
              </select>
            </div>
          </div>

          {/* PROTEKSI HAK AKSES PAKET */}
          <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-2xl space-y-2">
            <label className="text-xs font-bold text-amber-900 flex items-center gap-1 uppercase tracking-wide">
              <Lock className="w-3.5 h-3.5 text-amber-600" /> Proteksi Hak Unduh Dokumen
            </label>
            <p className="text-[11px] text-amber-700 leading-relaxed font-medium">Hanya akun siswa / tentor yang terikat dengan kelas paket bersangkutan yang diizinkan mengunduh berkas ini dari mobile app.</p>
            <select
              required
              value={formData.allowed_package_id}
              onChange={(e) => setFormData({...formData, allowed_package_id: e.target.value})}
              className="w-full rounded-xl border border-amber-200 px-3 py-2 text-sm bg-white font-semibold text-gray-700 focus:outline-none"
            >
              <option value="">Pilih Paket Berhak Akses</option>
              <option value="1">Intensif SMA 12 (Rumah)</option>
              <option value="2">Reguler SMP 9 (Bimbel)</option>
            </select>
          </div>

          {/* Box Dropzone File PDF */}
          {!data && (
            <div>
              <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Pilih Dokumen File PDF</label>
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer relative group mt-1.5">
                <input
                  type="file"
                  required
                  accept=".pdf"
                  onChange={(e) => setFormData({...formData, file: e.target.files[0]})}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-8 h-8 text-gray-400 mx-auto mb-2 group-hover:text-blue-500 transition-colors" />
                <p className="text-xs font-bold text-gray-700">Klik atau seret berkas e-book ke sini</p>
                <p className="text-[10px] text-gray-400 mt-0.5">Ekstensi dokumen dikunci murni PDF (Maksimal 10MB)</p>
                {formData.file && (
                  <p className="text-xs font-black text-emerald-600 mt-2 bg-emerald-50 py-1 px-3 rounded-lg inline-block">Selected: {formData.file.name}</p>
                )}
              </div>
            </div>
          )}

          <div className="pt-2 flex gap-3">
            <button type="button" onClick={onClose} className="w-full py-2.5 bg-gray-100 text-gray-600 rounded-xl text-sm font-medium">Batal</button>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-xs hover:bg-blue-700"
            >
              {loading ? "Menyimpan Data..." : "Mulai Upload Berkas"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}