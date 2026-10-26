import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function ExamModal({ open, onClose, data, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    subject_id: "",
    tutor_id: "",
    title: "",
    exam_date: "",
    duration: "",
    total_score: 100, // Default nilai maksimal ideal
  });

  useEffect(() => {
    if (data) {
      setFormData({
        subject_id: data.subject_id || "",
        tutor_id: data.tutor_id || "",
        title: data.title || "",
        exam_date: data.exam_date || "",
        duration: data.duration || "",
        total_score: data.total_score || 100,
      });
    } else {
      setFormData({ subject_id: "", tutor_id: "", title: "", exam_date: "", duration: "", total_score: 100 });
    }
  }, [data, open]);

  if (!open) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-xl bg-white rounded-3xl p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button onClick={onClose} className="absolute right-6 top-6 text-gray-400 hover:text-gray-600">
          <X className="w-6 h-6" />
        </button>

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{data ? "Edit Konfigurasi Ujian" : "Buat Modul Ujian Baru"}</h2>
          <p className="text-sm text-gray-500">Sesuaikan target pengerjaan ujian kuis siswa bimbel</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Judul Ujian */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Judul Ujian / Kuis</label>
            <input 
              type="text" required value={formData.title} 
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full rounded-xl border px-4 py-2.5" placeholder="Contoh: Tryout UTBK 1 Matematika, Kuis Harian Fisika" 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Relasi Mapel */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Mata Pelajaran</label>
              <select 
                required value={formData.subject_id} 
                onChange={(e) => setFormData({...formData, subject_id: e.target.value})}
                className="w-full rounded-xl border px-3 py-2.5 bg-white text-sm"
              >
                <option value="">Pilih Mapel</option>
                {/* Opsi diambil dari data master mata pelajaran */}
                <option value="1">Matematika Peminatan</option>
              </select>
            </div>
            
            {/* Relasi Pembuat/Tentor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Pembuat Soal (Tentor)</label>
              <select 
                required value={formData.tutor_id} 
                onChange={(e) => setFormData({...formData, tutor_id: e.target.value})}
                className="w-full rounded-xl border px-3 py-2.5 bg-white text-sm"
              >
                <option value="">Pilih Tentor</option>
                {/* Opsi diambil dari master tentor */}
                <option value="1">Budi Santoso, S.Pd.</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {/* Tanggal Pelaksanaan */}
            <div className="col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Ujian</label>
              <input 
                type="date" required value={formData.exam_date} 
                onChange={(e) => setFormData({...formData, exam_date: e.target.value})}
                className="w-full rounded-xl border px-3 py-2 text-sm" 
              />
            </div>
            {/* Durasi Ujian */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durasi (Menit)</label>
              <input 
                type="number" required value={formData.duration} 
                onChange={(e) => setFormData({...formData, duration: parseInt(e.target.value)})}
                className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="90" 
              />
            </div>
            {/* Total Nilai Target */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Total Skor Maks</label>
              <input 
                type="number" required value={formData.total_score} 
                onChange={(e) => setFormData({...formData, total_score: parseInt(e.target.value)})}
                className="w-full rounded-xl border px-3 py-2 text-sm" placeholder="100" 
              />
            </div>
          </div>

          <div className="pt-2">
            <button type="submit" disabled={loading} className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors shadow-sm">
              {loading ? "Menyimpan..." : "Simpan Ujian"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}