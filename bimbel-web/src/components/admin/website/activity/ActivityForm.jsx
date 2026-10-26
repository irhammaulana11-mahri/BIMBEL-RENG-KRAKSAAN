import React from "react";
import DatePicker from "react-datepicker";
import { UploadCloud } from "lucide-react";
import ActivityPreview from "./AcitvityPreview"; 
import "react-datepicker/dist/react-datepicker.css";

export default function ActivityForm({ form, setForm, preview, handleImage, activityFile }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      
      {/* Kolom Kiri: Input Teknis Master Data (Col Span 7) */}
      <div className="lg:col-span-7 space-y-4">
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Judul Agenda / Kegiatan</label>
          <input 
            required
            name="title" 
            value={form.title} 
            onChange={handleChange} 
            className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
            placeholder="Contoh: Try Out Akbar Kesiapan UTBK 2026 Cabang Pusat"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">Tanggal Pelaksanaan</label>
            <div className="mt-1.5 relative custom-datepicker-wrapper">
              <DatePicker 
                required
                selected={form.activity_date ? new Date(form.activity_date) : null} 
                onChange={(date) => setForm({ ...form, activity_date: date })}
                dateFormat="dd MMM yyyy"
                placeholderText="Pilih Tanggal"
                className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm bg-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Lokasi / Tempat Acara</label>
            <input 
              required
              name="location" 
              value={form.location} 
              onChange={handleChange} 
              className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Contoh: Aula lt.2 Ruko Kraksaan"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Deskripsi Lengkap / Rilis Berita</label>
          <textarea 
            rows="5" 
            name="description" 
            value={form.description} 
            onChange={handleChange} 
            className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2 text-xs leading-relaxed resize-none focus:outline-none focus:border-blue-500"
            placeholder="Tuliskan rangkuman acara, hasil kegiatan, atau pengumuman penting bagi siswa..."
          />
        </div>

        {/* Pembaruan Box Upload File Sampul Gambar */}
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-1.5">Berkas Gambar Sampul (Cover)</label>
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer relative group">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImage} 
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <UploadCloud className="w-7 h-7 text-gray-400 mx-auto mb-1.5 group-hover:text-blue-500 transition-colors" />
            <p className="text-xs font-bold text-gray-700">
              {activityFile ? "Ubah berkas terpilih" : "Klik atau seret foto sampul ke sini"}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Format: JPG, PNG, WEBP (Max. 5MB)</p>
            {activityFile && (
              <p className="text-xs font-black text-emerald-600 mt-2 bg-emerald-50 py-1 px-3 rounded-lg inline-block truncate max-w-xs">
                Selected: {activityFile.name}
              </p>
            )}
          </div>
        </div>
        
        {/* Status Checkbox */}
        <div className="pt-1">
          <label className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={form.is_active} 
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Tampilkan di Halaman Galeri Publik Website
          </label>
        </div>
      </div>

      {/* Kolom Kanan: Sticky Preview Area (Col Span 5) */}
      <div className="lg:col-span-5 flex flex-col justify-start">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2.5">Live Mobile View Preview</span>
        <div className="sticky top-2">
          <ActivityPreview 
            form={{
              ...form,
              cover_image: preview || (form.cover_image ? `http://127.0.0.1:8001${form.cover_image}` : ""),
            }}
          />
        </div>
      </div>

    </div>
  );
}