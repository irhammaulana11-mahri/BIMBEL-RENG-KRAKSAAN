import React from "react";
import { Star, UploadCloud } from "lucide-react";
import TestimonialPreview from "./TestimonialPreview";

export default function TestimonialForm({ form, setForm, handleImage, preview, testimonialFile }) {
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
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Nama Lengkap Siswa</label>
            <input 
              type="text" 
              required
              value={form.student_name} 
              onChange={(e) => setForm({ ...form, student_name: e.target.value })}
              className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Contoh: Rian Mahri"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Asal Sekolah / Kampus Lolos</label>
            <input 
              type="text" 
              required
              value={form.school_name} 
              onChange={(e) => setForm({ ...form, school_name: e.target.value })}
              className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:border-blue-500"
              placeholder="Contoh: SMAN 1 Kraksaan / UGM"
            />
          </div>
        </div>

        {/* Input Rating Bintang */}
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block">Apresiasi Rating Bimbingan</label>
          <div className="flex gap-1.5 mt-2 bg-slate-50 p-3 rounded-xl border border-gray-100 inline-flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star 
                key={star} 
                size={22} 
                onClick={() => setForm({ ...form, rating: star })}
                className={`cursor-pointer transition-transform hover:scale-110 duration-150 ${
                  star <= form.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                }`}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide">Isi Naskah Ulasan (Testimoni)</label>
          <textarea 
            rows={4} 
            required
            value={form.testimonial} 
            onChange={(e) => setForm({ ...form, testimonial: e.target.value })}
            className="w-full mt-1.5 rounded-xl border border-gray-200 px-4 py-2 text-xs leading-relaxed resize-none focus:outline-none focus:border-blue-500"
            placeholder="Tuliskan cerita sukses siswa, metode tentor favorit, atau kesan selama belajar di cabang..."
          />
        </div>

        {/* Pembaruan Box Unggah Foto Siswa */}
        <div>
          <label className="text-xs font-bold text-gray-700 uppercase tracking-wide block mb-1.5">Foto Profil Murid / Wali</label>
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 text-center bg-gray-50/50 hover:bg-gray-50 transition-colors cursor-pointer relative group">
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleImage} 
              className="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            <UploadCloud className="w-7 h-7 text-gray-400 mx-auto mb-1.5 group-hover:text-blue-500 transition-colors" />
            <p className="text-xs font-bold text-gray-700">
              {testimonialFile ? "Ubah berkas foto profil" : "Klik untuk unggah foto siswa"}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">Format: JPG, PNG, WEBP (Max. 3MB)</p>
            {testimonialFile && (
              <p className="text-xs font-black text-emerald-600 mt-2 bg-emerald-50 py-1 px-3 rounded-lg inline-block truncate max-w-xs">
                Selected: {testimonialFile.name}
              </p>
            )}
          </div>
        </div>
        
        {/* Status Publikasi */}
        <div className="pt-1">
          <label className="flex items-center gap-2.5 text-sm font-semibold text-gray-700 cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={form.is_active} 
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Aktifkan Ulasan (Tampilkan di Beranda Web Utama)
          </label>
        </div>
      </div>

      {/* Kolom Kanan: Sticky Preview Area (Col Span 5) */}
      <div className="lg:col-span-5 flex flex-col justify-start">
        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2.5">Live Desktop & Mobile Preview</span>
        <div className="sticky top-2">
          <TestimonialPreview form={form} preview={preview} />
        </div>
      </div>

    </div>
  );
}