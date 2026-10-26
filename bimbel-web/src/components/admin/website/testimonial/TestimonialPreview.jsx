import React from "react";
import { Star } from "lucide-react";

export default function TestimonialPreview({ form, preview }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-xs relative">
      <div className="absolute top-4 right-4 text-4xl text-blue-500/10 font-serif font-black select-none">”</div>
      
      <div className="p-6">
        {/* Rating Grid */}
        <div className="flex gap-0.5 mb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star 
              key={i} 
              size={15} 
              className={`${i < Number(form.rating || 0) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
            />
          ))}
        </div>

        {/* Isi Ulasan */}
        <p className="text-gray-600 text-xs font-medium leading-relaxed italic min-h-[60px]">
          "{form.testimonial || "Pesan ulasan kepuasan murid atau wali murid terkait kenyamanan fasilitas bimbel akan ter-render otomatis di area ini..."}"
        </p>

        {/* Info Penulis Ulasan */}
        <div className="flex items-center gap-3 mt-6 border-t border-gray-50 pt-4">
          <img
            src={preview || "https://ui-avatars.com/api/?name=Student"}
            alt="Preview Siswa" 
            className="w-12 h-12 rounded-full border border-gray-100 object-cover shrink-0 bg-slate-50"
          />

          <div className="truncate">
            <h3 className="font-bold text-gray-950 text-sm truncate">{form.student_name || "Nama Lengkap Murid"}</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wide truncate mt-0.5">{form.school_name || "Asal Sekolah / Kelas"}</p>
          </div>
        </div>
      </div>
    </div>
  );
}